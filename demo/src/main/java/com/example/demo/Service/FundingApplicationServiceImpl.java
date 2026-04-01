package com.example.demo.Service;

import com.example.demo.DTO.FundingApplicationRequestDTO;
import com.example.demo.DTO.FundingApplicationResponseDTO;
import com.example.demo.Entity.FundingApplication;
import com.example.demo.Entity.Investment;
import com.example.demo.Entity.Startup;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.FundingApplicationRepositary;
import com.example.demo.Repositary.InvestmentRepositary;
import com.example.demo.Repositary.StartupRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FundingApplicationServiceImpl implements FundingApplicationService {

        private final FundingApplicationRepositary applicationRepository;
        private final StartupRepositary startupRepository;
        private final UserRepositary userRepository;
        private final InvestmentRepositary investmentRepository;
        private final NotificationService notificationService;
        private final com.example.demo.Repositary.CapTableRepositary capTableRepository;

        @Override
        public FundingApplicationResponseDTO applyForFunding(FundingApplicationRequestDTO dto) {
                Startup startup = startupRepository.findById(dto.getStartupId())
                                .orElseThrow(() -> new RuntimeException("Startup not found"));
                User investor = userRepository.findById(dto.getInvestorId())
                                .orElseThrow(() -> new RuntimeException("Investor not found"));

                Double offered = dto.getEquityOffered() != null ? dto.getEquityOffered() : 10.0;
                
                // Calculate total earmarked equity (Pending requests)
                List<FundingApplication> pendingApps = applicationRepository.findByStartupId(startup.getId())
                    .stream().filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).toList();
                Double totalEarmarked = pendingApps.stream().mapToDouble(FundingApplication::getEquityOffered).sum();

                // Validate against available equity
                Double available = startup.getAvailableEquity() != null ? startup.getAvailableEquity() : 100.0;
                if (offered + totalEarmarked > available) {
                    String msg = String.format("Insufficient available equity. Available: %.2f%%, Already earmarked: %.2f%%. Remaining: %.2f%%.", 
                        available, totalEarmarked, available - totalEarmarked);
                    throw new RuntimeException(msg);
                }

                FundingApplication application = new FundingApplication();
                application.setStartup(startup);
                application.setInvestor(investor);
                application.setAmount(dto.getAmount());
                application.setEquityOffered(offered);
                application.setMessage(dto.getMessage());

                FundingApplication savedApplication = applicationRepository.save(application);

                // Notify investor
                notificationService.createNotification(
                                investor,
                                "New funding application from " + startup.getName(),
                                "NEW_APPLICATION");

                return convertToDTO(savedApplication);
        }

        @Override
        public List<FundingApplicationResponseDTO> getApplicationsForInvestor(Long investorId) {
                return applicationRepository.findByInvestorId(investorId).stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public List<FundingApplicationResponseDTO> getApplicationsForStartup(Long startupId) {
                return applicationRepository.findByStartupId(startupId).stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public List<FundingApplicationResponseDTO> getAllApplications() {
                return applicationRepository.findAll().stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public FundingApplicationResponseDTO updateApplicationStatus(Long id, String status) {
                FundingApplication application = applicationRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Application not found"));

                application.setStatus(status.toUpperCase());

                // Notify startup founder
                notificationService.createNotification(
                                application.getStartup().getFounder(),
                                "Your funding application for " + application.getStartup().getName() + " has been "
                                                + status.toUpperCase(),
                                "APPLICATION_STATUS_UPDATE");

                // If approved, create an Investment record and UPDATE CAP TABLE
                if (status.equalsIgnoreCase("APPROVED")) {
                        Investment investment = new Investment();
                        investment.setAmount(application.getAmount());
                        investment.setInvestor(application.getInvestor());
                        investment.setStartup(application.getStartup());
                        investment.setInvestmentDate(LocalDate.now());
                        investmentRepository.save(investment);

                        // --- CAP TABLE LOGIC ---
                        Startup startup = application.getStartup();
                        Double investorEquityPercent = application.getEquityOffered();

                        // Null-safe total shares
                        Long totalShares = startup.getTotalAuthorizedShares();
                        if (totalShares == null) totalShares = 10000000L;

                        List<com.example.demo.Entity.CapTableEntry> existingEntries = capTableRepository.findByStartupId(startup.getId());
                        
                        // Dilute ALL existing shareholders
                        for (com.example.demo.Entity.CapTableEntry entry : existingEntries) {
                            Double currentPercent = entry.getOwnershipPercentage();
                            entry.setOwnershipPercentage(currentPercent * (1 - (investorEquityPercent / 100.0)));
                            entry.setShares(Math.round((entry.getOwnershipPercentage() / 100.0) * totalShares));
                            capTableRepository.save(entry);
                        }

                        // Check if this investor already has an entry to consolidate
                        com.example.demo.Entity.CapTableEntry investorEntry = existingEntries.stream()
                            .filter(e -> e.getOwnerUser() != null && e.getOwnerUser().getId().equals(application.getInvestor().getId()))
                            .findFirst().orElse(null);

                        if (investorEntry != null) {
                            // Update existing (already diluted) entry with the new stake
                            investorEntry.setOwnershipPercentage(investorEntry.getOwnershipPercentage() + investorEquityPercent);
                            investorEntry.setShares(Math.round((investorEntry.getOwnershipPercentage() / 100.0) * totalShares));
                            capTableRepository.save(investorEntry);
                        } else {
                            // Create new entry
                            investorEntry = new com.example.demo.Entity.CapTableEntry();
                            investorEntry.setStartup(startup);
                            investorEntry.setOwnerName(application.getInvestor().getName());
                            investorEntry.setOwnerUser(application.getInvestor());
                            investorEntry.setOwnerType("INVESTOR");
                            investorEntry.setOwnershipPercentage(investorEquityPercent);
                            investorEntry.setShares(Math.round((investorEquityPercent / 100.0) * totalShares));
                            capTableRepository.save(investorEntry);
                        }

                        // Update available equity on startup
                        Double remaining = (startup.getAvailableEquity() != null ? startup.getAvailableEquity() : 100.0) - investorEquityPercent;
                        startup.setAvailableEquity(Math.max(0, remaining));
                        startupRepository.save(startup);
                }

                return convertToDTO(applicationRepository.save(application));
        }

        private FundingApplicationResponseDTO convertToDTO(FundingApplication application) {
                FundingApplicationResponseDTO dto = new FundingApplicationResponseDTO();
                dto.setId(application.getId());
                dto.setStartupId(application.getStartup().getId());
                dto.setStartupName(application.getStartup().getName());
                dto.setInvestorId(application.getInvestor().getId());
                dto.setInvestorName(application.getInvestor().getName());
                dto.setAmount(application.getAmount());
                dto.setEquityOffered(application.getEquityOffered());
                dto.setMessage(application.getMessage());
                dto.setStatus(application.getStatus());
                dto.setApplicationDate(application.getApplicationDate());
                return dto;
        }
}

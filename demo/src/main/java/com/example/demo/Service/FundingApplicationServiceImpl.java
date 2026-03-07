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

        @Override
        public FundingApplicationResponseDTO applyForFunding(FundingApplicationRequestDTO dto) {
                Startup startup = startupRepository.findById(dto.getStartupId())
                                .orElseThrow(() -> new RuntimeException("Startup not found"));
                User investor = userRepository.findById(dto.getInvestorId())
                                .orElseThrow(() -> new RuntimeException("Investor not found"));

                FundingApplication application = new FundingApplication();
                application.setStartup(startup);
                application.setInvestor(investor);
                application.setAmount(dto.getAmount());
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

                // If approved, create an Investment record automatically
                if (status.equalsIgnoreCase("APPROVED")) {
                        Investment investment = new Investment();
                        investment.setAmount(application.getAmount());
                        investment.setInvestor(application.getInvestor());
                        investment.setStartup(application.getStartup());
                        investment.setInvestmentDate(LocalDate.now());
                        investmentRepository.save(investment);
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
                dto.setMessage(application.getMessage());
                dto.setStatus(application.getStatus());
                dto.setApplicationDate(application.getApplicationDate());
                return dto;
        }
}

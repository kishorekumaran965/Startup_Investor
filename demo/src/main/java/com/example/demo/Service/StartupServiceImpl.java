package com.example.demo.Service;

import com.example.demo.DTO.StartupRequestDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.DTO.UserResponseDTO;
import com.example.demo.DTO.FundingResponseDTO;
import com.example.demo.DTO.InvestmentResponseDTO;
import com.example.demo.Entity.Startup;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.StartupRepositary;
import com.example.demo.Repositary.UserRepositary;
import com.example.demo.Repositary.MentorRepositary;
import com.example.demo.Repositary.MentorshipRequestRepositary;
import com.example.demo.Entity.Mentor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StartupServiceImpl implements StartupService {

    private final StartupRepositary startupRepository;
    private final UserRepositary userRepository;
    private final MentorRepositary mentorRepository;
    private final MentorshipRequestRepositary requestRepository;
    private final NotificationService notificationService;
    private final com.example.demo.Repositary.CapTableRepositary capTableRepository;

    private StartupResponseDTO convertToDTO(Startup startup) {
        StartupResponseDTO dto = new StartupResponseDTO();
        dto.setId(startup.getId());
        dto.setName(startup.getName());
        dto.setDescription(startup.getDescription());
        dto.setSector(startup.getSector());
        dto.setIndustry(startup.getSector()); // alias for frontend
        dto.setStage(startup.getStage());
        dto.setFundingGoal(startup.getFundingGoal());
        dto.setAvailableEquity(startup.getAvailableEquity());

        // Financial fields mapping
        dto.setAnnualRevenue(startup.getAnnualRevenue());
        dto.setMonthlyRevenue(startup.getMonthlyRevenue());
        dto.setAnnualRevenueGrowth(startup.getAnnualRevenueGrowth());
        dto.setNetProfitLoss(startup.getNetProfitLoss());
        dto.setProfitMargin(startup.getProfitMargin());
        dto.setMonthlyExpenses(startup.getMonthlyExpenses());
        dto.setCashBalance(startup.getCashBalance());
        dto.setMonthlyBurnRate(startup.getMonthlyBurnRate());
        dto.setRunwayMonths(startup.getRunwayMonths());
        dto.setTotalFundingRaised(startup.getTotalFundingRaised());
        dto.setCompanyValuation(startup.getCompanyValuation());
        dto.setDebt(startup.getDebt());
        dto.setCac(startup.getCac());
        dto.setLtv(startup.getLtv());
        dto.setRecurringRevenue(startup.getRecurringRevenue());
        dto.setGrossProfitMargin(startup.getGrossProfitMargin());
        dto.setTotalAssets(startup.getTotalAssets());
        dto.setTotalLiabilities(startup.getTotalLiabilities());
        dto.setBreakEvenStatus(startup.getBreakEvenStatus());
        dto.setInvestmentPotentialTier(startup.getInvestmentPotentialTier());
        dto.setInvestmentPotentialScore(startup.getInvestmentPotentialScore());

        if (startup.getFounder() != null) {
            dto.setUserId(startup.getFounder().getId());
            UserResponseDTO userDTO = new UserResponseDTO();
            userDTO.setId(startup.getFounder().getId());
            userDTO.setName(startup.getFounder().getName());
            userDTO.setEmail(startup.getFounder().getEmail());
            userDTO.setRole(startup.getFounder().getRole().toString());
            dto.setFounder(userDTO);
        }

        // Convert fundings to DTOs without startup to avoid circular reference
        List<FundingResponseDTO> fundingDTOs = startup.getFundings().stream()
                .map(funding -> {
                    FundingResponseDTO fundingDTO = new FundingResponseDTO();
                    fundingDTO.setId(funding.getId());
                    fundingDTO.setAmount(funding.getAmount());
                    fundingDTO.setFundingSource(funding.getFundingSource());
                    fundingDTO.setFundingType(
                            funding.getFundingType() != null ? funding.getFundingType().toString() : null);
                    fundingDTO.setStatus(funding.getStatus());
                    fundingDTO.setFundingDate(funding.getFundingDate());
                    fundingDTO.setStartupId(funding.getStartup().getId());
                    return fundingDTO;
                })
                .collect(Collectors.toList());
        dto.setFundings(fundingDTOs);

        // Convert investments to DTOs without startup to avoid circular reference
        List<InvestmentResponseDTO> investmentDTOs = startup.getInvestments().stream()
                .map(investment -> {
                    InvestmentResponseDTO investmentDTO = new InvestmentResponseDTO();
                    investmentDTO.setId(investment.getId());
                    investmentDTO.setAmount(investment.getAmount());
                    investmentDTO.setInvestmentDate(investment.getInvestmentDate());
                    investmentDTO.setStartupId(investment.getStartup().getId());
                    if (investment.getInvestor() != null) {
                        investmentDTO.setInvestorId(investment.getInvestor().getId());
                    }
                    return investmentDTO;
                })
                .collect(Collectors.toList());
        dto.setInvestments(investmentDTOs);

        if (startup.getMentor() != null) {
            // Check if there is an active (non-expired) approved request
            boolean isActive = requestRepository
                    .findByStartupIdAndMentorId(startup.getId(), startup.getMentor().getId()).stream()
                    .anyMatch(r -> "APPROVED".equalsIgnoreCase(r.getStatus()) &&
                            (r.getExpiryDate() == null || r.getExpiryDate().isAfter(java.time.LocalDateTime.now())));

            if (isActive) {
                dto.setMentorId(startup.getMentor().getId());
            } else {
                // Mentorship expired or revoked
                dto.setMentorId(null);
            }
        }

        return dto;
    }

    @Override
    public StartupResponseDTO saveStartup(StartupRequestDTO dto) {

        Long founderId = dto.getResolvedFounderId();
        if (founderId == null) {
            throw new RuntimeException("Founder/User ID cannot be null");
        }

        User user = userRepository.findById(founderId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + founderId));

        Startup startup = new Startup();
        startup.setName(dto.getName());
        startup.setDescription(dto.getDescription());
        startup.setSector(dto.getResolvedSector());
        startup.setStage(dto.getStage());
        startup.setFundingGoal(dto.getFundingGoal());
        startup.setFounder(user);
        applyFinancialsFromDTO(startup, dto);

        Startup saved = startupRepository.save(startup);

        // Initialize Cap Table with Founder
        com.example.demo.Entity.CapTableEntry founderEntry = new com.example.demo.Entity.CapTableEntry();
        founderEntry.setStartup(saved);
        founderEntry.setOwnerName(user.getName());
        founderEntry.setOwnerUser(user);
        founderEntry.setOwnerType("FOUNDER");
        founderEntry.setShares(saved.getTotalAuthorizedShares());
        founderEntry.setOwnershipPercentage(100.0);
        capTableRepository.save(founderEntry);

        return convertToDTO(saved);
    }

    @Override
    public List<StartupResponseDTO> getAllStartups() {
        return startupRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public StartupResponseDTO getStartupById(Long id) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + id));
        return convertToDTO(startup);
    }

    @Override
    public StartupResponseDTO updateStartup(Long id, StartupRequestDTO dto) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + id));

        Long founderId = dto.getResolvedFounderId();
        if (founderId != null) {
            User user = userRepository.findById(founderId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + founderId));
            startup.setFounder(user);
        }

        startup.setName(dto.getName());
        startup.setDescription(dto.getDescription());
        startup.setSector(dto.getResolvedSector());
        startup.setStage(dto.getStage());
        startup.setFundingGoal(dto.getFundingGoal());
        applyFinancialsFromDTO(startup, dto);

        Startup saved = startupRepository.save(startup);
        return convertToDTO(saved);
    }

    private void applyFinancialsFromDTO(Startup startup, StartupRequestDTO dto) {
        if (dto.getAnnualRevenue() != null) startup.setAnnualRevenue(dto.getAnnualRevenue());
        if (dto.getMonthlyRevenue() != null) startup.setMonthlyRevenue(dto.getMonthlyRevenue());
        if (dto.getAnnualRevenueGrowth() != null) startup.setAnnualRevenueGrowth(dto.getAnnualRevenueGrowth());
        if (dto.getNetProfitLoss() != null) startup.setNetProfitLoss(dto.getNetProfitLoss());
        if (dto.getProfitMargin() != null) startup.setProfitMargin(dto.getProfitMargin());
        if (dto.getMonthlyExpenses() != null) startup.setMonthlyExpenses(dto.getMonthlyExpenses());
        if (dto.getCashBalance() != null) startup.setCashBalance(dto.getCashBalance());
        if (dto.getMonthlyBurnRate() != null) startup.setMonthlyBurnRate(dto.getMonthlyBurnRate());
        if (dto.getRunwayMonths() != null) startup.setRunwayMonths(dto.getRunwayMonths());
        if (dto.getTotalFundingRaised() != null) startup.setTotalFundingRaised(dto.getTotalFundingRaised());
        if (dto.getCompanyValuation() != null) startup.setCompanyValuation(dto.getCompanyValuation());
        if (dto.getDebt() != null) startup.setDebt(dto.getDebt());
        if (dto.getCac() != null) startup.setCac(dto.getCac());
        if (dto.getLtv() != null) startup.setLtv(dto.getLtv());
        if (dto.getRecurringRevenue() != null) startup.setRecurringRevenue(dto.getRecurringRevenue());
        if (dto.getGrossProfitMargin() != null) startup.setGrossProfitMargin(dto.getGrossProfitMargin());
        if (dto.getTotalAssets() != null) startup.setTotalAssets(dto.getTotalAssets());
        if (dto.getTotalLiabilities() != null) startup.setTotalLiabilities(dto.getTotalLiabilities());
        if (dto.getBreakEvenStatus() != null) startup.setBreakEvenStatus(dto.getBreakEvenStatus());
        if (dto.getAvailableEquity() != null) startup.setAvailableEquity(dto.getAvailableEquity());

        // Baseline assessment based on financial & stage indicators
        calculateHeuristicPotential(startup);
    }

    private void calculateHeuristicPotential(Startup startup) {
        double score = 50.0; // Base score

        if (startup.getAnnualRevenue() != null && startup.getAnnualRevenue() > 50000) score += 10;
        if (startup.getAnnualRevenueGrowth() != null && startup.getAnnualRevenueGrowth() > 20) score += 10;
        if (startup.getNetProfitLoss() != null && startup.getNetProfitLoss() >= 0) score += 10;

        if (startup.getRunwayMonths() != null) {
            if (startup.getRunwayMonths() >= 12) score += 10;
            else if (startup.getRunwayMonths() < 6) score -= 15;
        }

        if (startup.getCac() != null && startup.getCac() > 0 && startup.getLtv() != null) {
            double ratio = startup.getLtv() / startup.getCac();
            if (ratio >= 3.0) score += 15;
            else if (ratio < 1.0) score -= 10;
        }

        if (startup.getMentor() != null) score += 5;

        score = Math.max(0.0, Math.min(100.0, score));
        startup.setInvestmentPotentialScore(score);

        if (score >= 70.0) {
            startup.setInvestmentPotentialTier("HIGH_POTENTIAL");
        } else if (score >= 45.0) {
            startup.setInvestmentPotentialTier("MODERATE_POTENTIAL");
        } else {
            startup.setInvestmentPotentialTier("LOW_POTENTIAL");
        }
    }

    @Override
    public void deleteStartup(Long id) {
        if (!startupRepository.existsById(id)) {
            throw new RuntimeException("Startup not found with ID: " + id);
        }
        startupRepository.deleteById(id);
    }

    @Override
    public List<FundingResponseDTO> getFundingsByStartupId(Long startupId) {
        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + startupId));
        return startup.getFundings().stream()
                .map(funding -> {
                    FundingResponseDTO fundingDTO = new FundingResponseDTO();
                    fundingDTO.setId(funding.getId());
                    fundingDTO.setAmount(funding.getAmount());
                    fundingDTO.setFundingSource(funding.getFundingSource());
                    fundingDTO.setFundingType(
                            funding.getFundingType() != null ? funding.getFundingType().toString() : null);
                    fundingDTO.setStatus(funding.getStatus());
                    fundingDTO.setFundingDate(funding.getFundingDate());
                    fundingDTO.setStartupId(funding.getStartup().getId());
                    return fundingDTO;
                })
                .collect(Collectors.toList());
    }

    @Override
    public StartupResponseDTO assignMentor(Long startupId, Long mentorId) {
        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + startupId));

        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found with ID: " + mentorId));

        if (!"APPROVED".equalsIgnoreCase(mentor.getStatus())) {
            throw new RuntimeException(
                    "Cannot assign a mentor who is not APPROVED. Current status: " + mentor.getStatus());
        }

        startup.setMentor(mentor);
        Startup saved = startupRepository.save(startup);

        // Notify startup founder
        if (saved.getFounder() != null) {
            System.out.println("DEBUG: Assigning mentor " + mentor.getId() + " to startup " + saved.getId());
            String mentorName = (mentor.getUser() != null) ? mentor.getUser().getName() : "Expert";
            notificationService.createNotification(
                    saved.getFounder(),
                    "Mentor " + mentorName + " has been assigned to your startup: " + saved.getName(),
                    "MENTOR_ASSIGNED");
            System.out.println("DEBUG: Notification created for founder: " + saved.getFounder().getEmail());
        }

        return convertToDTO(saved);
    }
}

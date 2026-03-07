package com.example.demo.Controller;

import com.example.demo.DTO.FundingRequestDTO;
import com.example.demo.DTO.FundingResponseDTO;
import com.example.demo.Service.FundingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fundings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FundingController {

    private final FundingService fundingService;

    @PostMapping
    public FundingResponseDTO createFunding(@RequestBody FundingRequestDTO dto) {
        return fundingService.saveFunding(dto);
    }

    @GetMapping
    public List<FundingResponseDTO> getAllFundings() {
        return fundingService.getAllFundings();
    }

    @GetMapping("/{id}")
    public FundingResponseDTO getFundingById(@PathVariable("id") Long id) {
        return fundingService.getFundingById(id);
    }

    @PutMapping("/{id}")
    public FundingResponseDTO updateFunding(@PathVariable("id") Long id, @RequestBody FundingRequestDTO dto) {
        return fundingService.updateFunding(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteFunding(@PathVariable("id") Long id) {
        fundingService.deleteFunding(id);
    }
}

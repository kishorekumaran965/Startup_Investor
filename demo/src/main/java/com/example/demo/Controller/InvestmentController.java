package com.example.demo.Controller;

import com.example.demo.DTO.InvestmentRequestDTO;
import com.example.demo.DTO.InvestmentResponseDTO;
import com.example.demo.Service.InvestmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvestmentController {

    private final InvestmentService investmentService;

    @PostMapping
    public InvestmentResponseDTO createInvestment(@RequestBody InvestmentRequestDTO dto) {
        return investmentService.saveInvestment(dto);
    }

    @GetMapping
    public List<InvestmentResponseDTO> getAllInvestments() {
        return investmentService.getAllInvestments();
    }

    @GetMapping("/{id}")
    public InvestmentResponseDTO getInvestmentById(@PathVariable("id") Long id) {
        return investmentService.getInvestmentById(id);
    }

    @PutMapping("/{id}")
    public InvestmentResponseDTO updateInvestment(@PathVariable("id") Long id, @RequestBody InvestmentRequestDTO dto) {
        return investmentService.updateInvestment(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteInvestment(@PathVariable("id") Long id) {
        investmentService.deleteInvestment(id);
    }
}

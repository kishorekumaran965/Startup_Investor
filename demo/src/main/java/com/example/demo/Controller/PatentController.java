package com.example.demo.Controller;

import com.example.demo.DTO.PatentRequestDTO;
import com.example.demo.DTO.PatentResponseDTO;
import com.example.demo.Service.PatentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PatentController {

    private final PatentService patentService;

    @PostMapping
    public PatentResponseDTO createPatent(@RequestBody PatentRequestDTO dto) {
        return patentService.savePatent(dto);
    }

    @GetMapping
    public List<PatentResponseDTO> getAllPatents() {
        return patentService.getAllPatents();
    }

    @GetMapping("/{id}")
    public PatentResponseDTO getPatentById(@PathVariable("id") Long id) {
        return patentService.getPatentById(id);
    }

    @PutMapping("/{id}")
    public PatentResponseDTO updatePatent(@PathVariable("id") Long id, @RequestBody PatentRequestDTO dto) {
        return patentService.updatePatent(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deletePatent(@PathVariable("id") Long id) {
        patentService.deletePatent(id);
    }
}

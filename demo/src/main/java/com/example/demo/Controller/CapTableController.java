package com.example.demo.Controller;

import com.example.demo.Entity.CapTableEntry;
import com.example.demo.Entity.Startup;
import com.example.demo.Repositary.CapTableRepositary;
import com.example.demo.Repositary.StartupRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/captable")
@RequiredArgsConstructor
public class CapTableController {

    private final CapTableRepositary capTableRepository;
    private final StartupRepositary startupRepository;

    @GetMapping("/startup/{startupId}")
    public List<CapTableEntry> getCapTable(@PathVariable Long startupId) {
        List<CapTableEntry> entries = capTableRepository.findByStartupId(startupId);
        
        // Robust fallback: If empty, initialize founder with 100%
        if (entries.isEmpty()) {
            Startup startup = startupRepository.findById(startupId).orElse(null);
            if (startup != null && startup.getFounder() != null) {
                CapTableEntry founderEntry = new CapTableEntry();
                founderEntry.setStartup(startup);
                founderEntry.setOwnerName(startup.getFounder().getName());
                founderEntry.setOwnerUser(startup.getFounder());
                founderEntry.setOwnerType("FOUNDER");
                founderEntry.setShares(startup.getTotalAuthorizedShares() != null ? startup.getTotalAuthorizedShares() : 10000000L);
                founderEntry.setOwnershipPercentage(100.0);
                
                entries.add(capTableRepository.save(founderEntry));
            }
        }
        
        return entries;
    }
}

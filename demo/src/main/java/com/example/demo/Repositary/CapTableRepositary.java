package com.example.demo.Repositary;

import com.example.demo.Entity.CapTableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CapTableRepositary extends JpaRepository<CapTableEntry, Long> {
    List<CapTableEntry> findByStartupId(Long startupId);
}

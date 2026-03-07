package com.example.demo.Repositary;

import com.example.demo.Entity.Patent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatentRepositary extends JpaRepository<Patent, Long> {

}

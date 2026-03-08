package com.example.demo.Repositary;

import com.example.demo.Entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ForumPostRepositary extends JpaRepository<ForumPost, Long> {
    List<ForumPost> findByCategoryOrderByCreatedAtDesc(String category);

    List<ForumPost> findAllByOrderByCreatedAtDesc();
}

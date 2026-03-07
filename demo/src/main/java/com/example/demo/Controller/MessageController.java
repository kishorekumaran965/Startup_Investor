package com.example.demo.Controller;

import com.example.demo.DTO.MessageRequestDTO;
import com.example.demo.DTO.MessageResponseDTO;
import com.example.demo.Service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public MessageResponseDTO sendMessage(@RequestBody MessageRequestDTO request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return messageService.sendMessage(request, email);
    }

    @GetMapping("/conversation/{otherUserId}")
    public List<MessageResponseDTO> getConversation(@PathVariable("otherUserId") Long otherUserId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return messageService.getConversation(otherUserId, email);
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable("id") Long id) {
        messageService.markAsRead(id);
    }

    @GetMapping("/recent-conversations")
    public List<com.example.demo.DTO.UserResponseDTO> getRecentConversations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return messageService.getRecentConversations(email);
    }
}

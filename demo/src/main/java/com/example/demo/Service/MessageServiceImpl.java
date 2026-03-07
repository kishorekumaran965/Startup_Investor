package com.example.demo.Service;

import com.example.demo.DTO.MessageRequestDTO;
import com.example.demo.DTO.MessageResponseDTO;
import com.example.demo.Entity.Message;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.MessageRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import com.example.demo.DTO.UserResponseDTO;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

        private final MessageRepositary messageRepository;
        private final UserRepositary userRepository;
        private final NotificationService notificationService;

        @Override
        public MessageResponseDTO sendMessage(MessageRequestDTO request, String senderEmail) {
                User sender = userRepository.findByEmail(senderEmail)
                                .orElseThrow(() -> new RuntimeException("Sender not found"));

                User receiver = userRepository.findById(request.getReceiverId())
                                .orElseThrow(() -> new RuntimeException("Receiver not found"));

                Message message = new Message();
                message.setSender(sender);
                message.setReceiver(receiver);
                message.setContent(request.getContent());

                Message savedMessage = messageRepository.save(message);

                // Notify receiver
                notificationService.createNotification(
                                receiver,
                                "New message from " + sender.getName(),
                                "NEW_MESSAGE",
                                sender.getId());

                return convertToDTO(savedMessage);
        }

        @Override
        public List<MessageResponseDTO> getConversation(Long otherUserId, String currentUserEmail) {
                User currentUser = userRepository.findByEmail(currentUserEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                User otherUser = userRepository.findById(otherUserId)
                                .orElseThrow(() -> new RuntimeException("Other user not found"));

                List<Message> messages = messageRepository
                                .findBySenderAndReceiverOrReceiverAndSenderOrderByTimestampAsc(
                                                currentUser, otherUser, currentUser, otherUser);

                return messages.stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public void markAsRead(Long messageId) {
                Message message = messageRepository.findById(messageId)
                                .orElseThrow(() -> new RuntimeException("Message not found"));
                message.setReadStatus(true);
                messageRepository.save(message);
        }

        @Override
        public List<UserResponseDTO> getRecentConversations(String email) {
                User currentUser = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Get all messages where user is sender or receiver, ordered by timestamp
                List<Message> messages = messageRepository.findBySenderOrReceiverOrderByTimestampDesc(currentUser,
                                currentUser);

                // Extract unique users (using LinkedHashSet to preserve order)
                Map<Long, Message> lastMessagesMap = new LinkedHashMap<>();
                for (Message m : messages) {
                        Long otherUserId = m.getSender().getId().equals(currentUser.getId())
                                        ? m.getReceiver().getId()
                                        : m.getSender().getId();

                        if (!lastMessagesMap.containsKey(otherUserId)) {
                                lastMessagesMap.put(otherUserId, m);
                        }
                }

                return lastMessagesMap.entrySet().stream().map(entry -> {
                        User u = entry.getValue().getSender().getId().equals(currentUser.getId())
                                        ? entry.getValue().getReceiver()
                                        : entry.getValue().getSender();

                        UserResponseDTO dto = new UserResponseDTO();
                        dto.setId(u.getId());
                        dto.setName(u.getName());
                        dto.setEmail(u.getEmail());
                        dto.setRole(u.getRole() != null ? u.getRole().toString() : null);
                        dto.setProfilePhotoUrl(u.getProfilePhotoUrl());
                        dto.setBio(u.getBio());
                        dto.setLastMessage(entry.getValue().getContent());
                        dto.setLastMessageTime(entry.getValue().getTimestamp());
                        return dto;
                }).collect(Collectors.toList());
        }

        private MessageResponseDTO convertToDTO(Message message) {
                MessageResponseDTO dto = new MessageResponseDTO();
                dto.setId(message.getId());
                dto.setSenderId(message.getSender().getId());
                dto.setSenderName(message.getSender().getName());
                dto.setReceiverId(message.getReceiver().getId());
                dto.setReceiverName(message.getReceiver().getName());
                dto.setContent(message.getContent());
                dto.setTimestamp(message.getTimestamp());
                dto.setRead(message.isReadStatus());
                return dto;
        }
}

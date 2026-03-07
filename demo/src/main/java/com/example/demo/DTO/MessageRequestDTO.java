package com.example.demo.DTO;

import lombok.Data;

@Data
public class MessageRequestDTO {
    private Long receiverId;
    private String content;
}

package com.example.demo.Repositary;

import com.example.demo.Entity.Message;
import com.example.demo.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepositary extends JpaRepository<Message, Long> {

    List<Message> findBySenderAndReceiver(User sender, User receiver);

    List<Message> findByReceiver(User receiver);

    // Find conversation between two users
    List<Message> findBySenderAndReceiverOrReceiverAndSenderOrderByTimestampAsc(
            User sender1, User receiver1, User receiver2, User sender2);

    // Find all messages for a user to determine recent conversations
    List<Message> findBySenderOrReceiverOrderByTimestampDesc(User sender, User receiver);
}

package com.example.demo.Entity;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role;

    @Column(length = 1000)
    private String profilePhotoUrl;

    @Column(length = 2000)
    private String bio;

    @JsonIgnore
    @OneToMany(mappedBy = "researcher", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ResearchProject> projects = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "founder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Startup> startups = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "investor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Investment> investments = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "recipient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Notification> notifications = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> sentMessages = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> receivedMessages = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "investor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FundingApplication> fundingApplications = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Mentor mentorProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private InvestorProfile investorProfile;

}

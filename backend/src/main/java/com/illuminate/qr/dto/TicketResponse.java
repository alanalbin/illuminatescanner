package com.illuminate.qr.dto;

import com.illuminate.qr.entity.Ticket;
import com.illuminate.qr.entity.TicketStatus;

import java.time.LocalDateTime;

public class TicketResponse {
    private Long id;
    private String ticketId;
    private String participantName;
    private String email;
    private String phone;
    private String qrToken;
    private String qrUrl;
    private String verificationUrl;
    private TicketStatus status;
    private boolean checkedIn;
    private LocalDateTime checkedInAt;
    private String checkedInBy;
    private LocalDateTime createdAt;

    public TicketResponse() {}

    public static TicketResponse fromEntity(Ticket ticket, String appDomain) {
        TicketResponse dto = new TicketResponse();
        dto.setId(ticket.getId());
        dto.setTicketId(ticket.getTicketId());
        dto.setParticipantName(ticket.getParticipantName());
        dto.setEmail(ticket.getEmail());
        dto.setPhone(ticket.getPhone());
        dto.setQrToken(ticket.getQrToken());
        dto.setStatus(ticket.getStatus());
        dto.setCheckedIn(ticket.isCheckedIn());
        dto.setCheckedInAt(ticket.getCheckedInAt());
        dto.setCheckedInBy(ticket.getCheckedInBy());
        dto.setCreatedAt(ticket.getCreatedAt());

        String domain = (appDomain != null && !appDomain.isBlank()) ? appDomain.replaceAll("/$", "") : "http://localhost:5173";
        dto.setVerificationUrl(domain + "/verify/" + ticket.getTicketId());
        dto.setQrUrl("/api/tickets/" + ticket.getTicketId() + "/qr");
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }

    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getQrToken() { return qrToken; }
    public void setQrToken(String qrToken) { this.qrToken = qrToken; }

    public String getQrUrl() { return qrUrl; }
    public void setQrUrl(String qrUrl) { this.qrUrl = qrUrl; }

    public String getVerificationUrl() { return verificationUrl; }
    public void setVerificationUrl(String verificationUrl) { this.verificationUrl = verificationUrl; }

    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }

    public boolean isCheckedIn() { return checkedIn; }
    public void setCheckedIn(boolean checkedIn) { this.checkedIn = checkedIn; }

    public LocalDateTime getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(LocalDateTime checkedInAt) { this.checkedInAt = checkedInAt; }

    public String getCheckedInBy() { return checkedInBy; }
    public void setCheckedInBy(String checkedInBy) { this.checkedInBy = checkedInBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

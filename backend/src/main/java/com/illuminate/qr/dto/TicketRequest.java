package com.illuminate.qr.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketRequest {

    @NotBlank(message = "Ticket ID is required")
    private String ticketId;

    @NotBlank(message = "Participant name is required")
    private String participantName;

    private String email;
    private String phone;

    public TicketRequest() {}

    public TicketRequest(String ticketId, String participantName, String email, String phone) {
        this.ticketId = ticketId;
        this.participantName = participantName;
        this.email = email;
        this.phone = phone;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
    }

    public String getParticipantName() {
        return participantName;
    }

    public void setParticipantName(String participantName) {
        this.participantName = participantName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}

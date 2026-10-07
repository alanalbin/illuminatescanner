package com.illuminate.qr.dto;

import java.time.LocalDateTime;

public class CheckinResponse {
    private boolean valid;
    private String status; // VALID, ALREADY_USED, INVALID, CANCELLED
    private String ticketId;
    private String participantName;
    private LocalDateTime checkedInAt;
    private String checkedInBy;
    private String message;

    public CheckinResponse() {}

    public static CheckinResponse valid(String ticketId, String participantName, LocalDateTime checkedInAt, String checkedInBy) {
        CheckinResponse r = new CheckinResponse();
        r.setValid(true);
        r.setStatus("VALID");
        r.setTicketId(ticketId);
        r.setParticipantName(participantName);
        r.setCheckedInAt(checkedInAt);
        r.setCheckedInBy(checkedInBy);
        r.setMessage("Entry Approved. Checked in successfully.");
        return r;
    }

    public static CheckinResponse alreadyUsed(String ticketId, String participantName, LocalDateTime checkedInAt, String checkedInBy) {
        CheckinResponse r = new CheckinResponse();
        r.setValid(false);
        r.setStatus("ALREADY_USED");
        r.setTicketId(ticketId);
        r.setParticipantName(participantName);
        r.setCheckedInAt(checkedInAt);
        r.setCheckedInBy(checkedInBy);
        r.setMessage("Entry Denied. This ticket has already been used.");
        return r;
    }

    public static CheckinResponse invalid(String message) {
        CheckinResponse r = new CheckinResponse();
        r.setValid(false);
        r.setStatus("INVALID");
        r.setMessage(message != null ? message : "This QR code is not registered.");
        return r;
    }

    public static CheckinResponse cancelled(String ticketId, String participantName) {
        CheckinResponse r = new CheckinResponse();
        r.setValid(false);
        r.setStatus("CANCELLED");
        r.setTicketId(ticketId);
        r.setParticipantName(participantName);
        r.setMessage("Entry Denied. This ticket has been cancelled.");
        return r;
    }

    // Getters and Setters
    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }

    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }

    public LocalDateTime getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(LocalDateTime checkedInAt) { this.checkedInAt = checkedInAt; }

    public String getCheckedInBy() { return checkedInBy; }
    public void setCheckedInBy(String checkedInBy) { this.checkedInBy = checkedInBy; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

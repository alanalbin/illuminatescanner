package com.illuminate.qr.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "checkins")
public class Checkin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false, length = 100)
    private String ticketId;

    @Column(name = "participant_name", length = 150)
    private String participantName;

    @Column(name = "scanned_by", length = 100)
    private String scannedBy;

    @Column(name = "scanned_at", nullable = false)
    private LocalDateTime scannedAt = LocalDateTime.now();

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(nullable = false, length = 50)
    private String result; // VALID, ALREADY_USED, INVALID, CANCELLED

    public Checkin() {}

    public Checkin(String ticketId, String participantName, String scannedBy, String result, String deviceInfo) {
        this.ticketId = ticketId;
        this.participantName = participantName;
        this.scannedBy = scannedBy;
        this.result = result;
        this.deviceInfo = deviceInfo;
        this.scannedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getScannedBy() {
        return scannedBy;
    }

    public void setScannedBy(String scannedBy) {
        this.scannedBy = scannedBy;
    }

    public LocalDateTime getScannedAt() {
        return scannedAt;
    }

    public void setScannedAt(LocalDateTime scannedAt) {
        this.scannedAt = scannedAt;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }
}

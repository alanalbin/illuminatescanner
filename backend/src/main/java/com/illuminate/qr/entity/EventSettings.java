package com.illuminate.qr.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_settings")
public class EventSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_name", nullable = false, length = 150)
    private String eventName = "ILLUMINATE";

    @Column(nullable = false, length = 150)
    private String organizer = "IIT Bombay E-Cell / KMCT";

    @Column(name = "event_year", nullable = false, length = 20)
    private String eventYear = "2026";

    @Column(name = "event_date", length = 100)
    private String eventDate = "October 2026";

    @Column(length = 255)
    private String venue = "KMCT Campus Auditorium";

    @Column(name = "logo_url", length = 255)
    private String logoUrl = "/logos/ecell-iitb.png";

    @Column(length = 50)
    private String theme = "PURPLE_BLACK";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public EventSettings() {}

    @PreUpdate
    @PrePersist
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public String getOrganizer() {
        return organizer;
    }

    public void setOrganizer(String organizer) {
        this.organizer = organizer;
    }

    public String getEventYear() {
        return eventYear;
    }

    public void setEventYear(String eventYear) {
        this.eventYear = eventYear;
    }

    public String getEventDate() {
        return eventDate;
    }

    public void setEventDate(String eventDate) {
        this.eventDate = eventDate;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

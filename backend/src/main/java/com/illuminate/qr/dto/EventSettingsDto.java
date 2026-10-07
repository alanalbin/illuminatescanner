package com.illuminate.qr.dto;

public class EventSettingsDto {
    private String eventName;
    private String organizer;
    private String eventYear;
    private String eventDate;
    private String venue;
    private String logoUrl;
    private String theme;

    public EventSettingsDto() {}

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getOrganizer() { return organizer; }
    public void setOrganizer(String organizer) { this.organizer = organizer; }

    public String getEventYear() { return eventYear; }
    public void setEventYear(String eventYear) { this.eventYear = eventYear; }

    public String getEventDate() { return eventDate; }
    public void setEventDate(String eventDate) { this.eventDate = eventDate; }

    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
}

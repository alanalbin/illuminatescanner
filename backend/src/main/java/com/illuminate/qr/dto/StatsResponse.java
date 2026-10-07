package com.illuminate.qr.dto;

import com.illuminate.qr.entity.Checkin;

import java.util.List;

public class StatsResponse {
    private long totalRegistrations;
    private long qrGenerated;
    private long checkedIn;
    private long remaining;
    private long invalidAttempts;
    private long cancelled;
    private List<Checkin> recentCheckins;

    public StatsResponse() {}

    public StatsResponse(long totalRegistrations, long qrGenerated, long checkedIn, long remaining, long invalidAttempts, long cancelled, List<Checkin> recentCheckins) {
        this.totalRegistrations = totalRegistrations;
        this.qrGenerated = qrGenerated;
        this.checkedIn = checkedIn;
        this.remaining = remaining;
        this.invalidAttempts = invalidAttempts;
        this.cancelled = cancelled;
        this.recentCheckins = recentCheckins;
    }

    public long getTotalRegistrations() {
        return totalRegistrations;
    }

    public void setTotalRegistrations(long totalRegistrations) {
        this.totalRegistrations = totalRegistrations;
    }

    public long getQrGenerated() {
        return qrGenerated;
    }

    public void setQrGenerated(long qrGenerated) {
        this.qrGenerated = qrGenerated;
    }

    public long getCheckedIn() {
        return checkedIn;
    }

    public void setCheckedIn(long checkedIn) {
        this.checkedIn = checkedIn;
    }

    public long getRemaining() {
        return remaining;
    }

    public void setRemaining(long remaining) {
        this.remaining = remaining;
    }

    public long getInvalidAttempts() {
        return invalidAttempts;
    }

    public void setInvalidAttempts(long invalidAttempts) {
        this.invalidAttempts = invalidAttempts;
    }

    public long getCancelled() {
        return cancelled;
    }

    public void setCancelled(long cancelled) {
        this.cancelled = cancelled;
    }

    public List<Checkin> getRecentCheckins() {
        return recentCheckins;
    }

    public void setRecentCheckins(List<Checkin> recentCheckins) {
        this.recentCheckins = recentCheckins;
    }
}

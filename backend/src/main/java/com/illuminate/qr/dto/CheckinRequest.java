package com.illuminate.qr.dto;

import jakarta.validation.constraints.NotBlank;

public class CheckinRequest {

    @NotBlank(message = "Ticket content is required")
    private String qrContent;

    private String deviceInfo;
    private String scannedBy;

    public CheckinRequest() {}

    public CheckinRequest(String qrContent, String deviceInfo, String scannedBy) {
        this.qrContent = qrContent;
        this.deviceInfo = deviceInfo;
        this.scannedBy = scannedBy;
    }

    public String getQrContent() {
        return qrContent;
    }

    public void setQrContent(String qrContent) {
        this.qrContent = qrContent;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public String getScannedBy() {
        return scannedBy;
    }

    public void setScannedBy(String scannedBy) {
        this.scannedBy = scannedBy;
    }
}

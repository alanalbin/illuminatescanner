package com.illuminate.qr.controller;

import com.illuminate.qr.dto.EventSettingsDto;
import com.illuminate.qr.entity.EventSettings;
import com.illuminate.qr.repository.EventSettingsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final EventSettingsRepository settingsRepository;

    public SettingsController(EventSettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @GetMapping
    public ResponseEntity<EventSettings> getSettings() {
        EventSettings settings = settingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    EventSettings s = new EventSettings();
                    return settingsRepository.save(s);
                });
        return ResponseEntity.ok(settings);
    }

    @PutMapping
    public ResponseEntity<EventSettings> updateSettings(@RequestBody EventSettingsDto dto) {
        EventSettings settings = settingsRepository.findAll().stream().findFirst()
                .orElseGet(EventSettings::new);

        if (dto.getEventName() != null) settings.setEventName(dto.getEventName());
        if (dto.getOrganizer() != null) settings.setOrganizer(dto.getOrganizer());
        if (dto.getEventYear() != null) settings.setEventYear(dto.getEventYear());
        if (dto.getEventDate() != null) settings.setEventDate(dto.getEventDate());
        if (dto.getVenue() != null) settings.setVenue(dto.getVenue());
        if (dto.getLogoUrl() != null) settings.setLogoUrl(dto.getLogoUrl());
        if (dto.getTheme() != null) settings.setTheme(dto.getTheme());

        return ResponseEntity.ok(settingsRepository.save(settings));
    }
}

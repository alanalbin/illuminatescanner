package com.illuminate.qr.repository;

import com.illuminate.qr.entity.EventSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventSettingsRepository extends JpaRepository<EventSettings, Long> {
}

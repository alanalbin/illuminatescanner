package com.illuminate.qr.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkImportResult {
    private int totalProcessed;
    private int importedCount;
    private int duplicateCount;
    private int errorCount;
    private List<String> errors = new ArrayList<>();
    private List<String> importedTicketIds = new ArrayList<>();

    public BulkImportResult() {}

    public int getTotalProcessed() { return totalProcessed; }
    public void setTotalProcessed(int totalProcessed) { this.totalProcessed = totalProcessed; }

    public int getImportedCount() { return importedCount; }
    public void setImportedCount(int importedCount) { this.importedCount = importedCount; }

    public int getDuplicateCount() { return duplicateCount; }
    public void setDuplicateCount(int duplicateCount) { this.duplicateCount = duplicateCount; }

    public int getErrorCount() { return errorCount; }
    public void setErrorCount(int errorCount) { this.errorCount = errorCount; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    public List<String> getImportedTicketIds() { return importedTicketIds; }
    public void setImportedTicketIds(List<String> importedTicketIds) { this.importedTicketIds = importedTicketIds; }
}

package backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Lob;

@Embeddable
public class TicketAttachment {

    @Column(nullable = false)
    private String fileName;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String dataUrl;

    public TicketAttachment() {
    }

    public TicketAttachment(String fileName, String dataUrl) {
        this.fileName = fileName;
        this.dataUrl = dataUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public String getDataUrl() {
        return dataUrl;
    }
}

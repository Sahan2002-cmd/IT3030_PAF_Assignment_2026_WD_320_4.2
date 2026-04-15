package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "resources")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Type is required")
    private String type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private int capacity;

    @NotBlank(message = "Location is required")
    private String location;

    private String availabilityWindows;

    @Enumerated(EnumType.STRING)
    private ResourceStatus status = ResourceStatus.ACTIVE;

    // ── Constructors ─────────────────────────────────────────────────────────────

    public Resource() {}

    public Resource(Long id, String name, String type, int capacity,
                    String location, String availabilityWindows, ResourceStatus status) {
        this.id                  = id;
        this.name                = name;
        this.type                = type;
        this.capacity            = capacity;
        this.location            = location;
        this.availabilityWindows = availabilityWindows;
        this.status              = status;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────────

    public Long getId()                          { return id; }
    public void setId(Long id)                   { this.id = id; }

    public String getName()                      { return name; }
    public void   setName(String name)           { this.name = name; }

    public String getType()                      { return type; }
    public void   setType(String type)           { this.type = type; }

    public int    getCapacity()                  { return capacity; }
    public void   setCapacity(int capacity)      { this.capacity = capacity; }

    public String getLocation()                  { return location; }
    public void   setLocation(String location)   { this.location = location; }

    public String getAvailabilityWindows()                       { return availabilityWindows; }
    public void   setAvailabilityWindows(String availabilityWindows) { this.availabilityWindows = availabilityWindows; }

    public ResourceStatus getStatus()                    { return status; }
    public void           setStatus(ResourceStatus status) { this.status = status; }
}
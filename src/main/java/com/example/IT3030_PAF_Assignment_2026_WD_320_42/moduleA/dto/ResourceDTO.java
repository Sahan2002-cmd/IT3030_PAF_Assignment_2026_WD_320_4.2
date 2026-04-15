package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.dto;

import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.ResourceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * DTOs for Module A – Facilities & Assets Catalogue.
 */
public class ResourceDTO {

    // ── Create Request ──────────────────────────────────────────────────────────

    public static class CreateRequest {

        @NotBlank(message = "Name is required")
        private String name;

        /** Accepted values: LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT */
        @NotBlank(message = "Type is required")
        private String type;

        @Min(value = 1, message = "Capacity must be at least 1")
        private int capacity;

        @NotBlank(message = "Location is required")
        private String location;

        /** e.g. "08:00-18:00" */
        private String availabilityWindows;

        public CreateRequest() {}

        public CreateRequest(String name, String type, int capacity,
                             String location, String availabilityWindows) {
            this.name                = name;
            this.type                = type;
            this.capacity            = capacity;
            this.location            = location;
            this.availabilityWindows = availabilityWindows;
        }

        public String getName()                { return name; }
        public void   setName(String name)     { this.name = name; }

        public String getType()                { return type; }
        public void   setType(String type)     { this.type = type; }

        public int    getCapacity()            { return capacity; }
        public void   setCapacity(int c)       { this.capacity = c; }

        public String getLocation()            { return location; }
        public void   setLocation(String loc)  { this.location = loc; }

        public String getAvailabilityWindows()             { return availabilityWindows; }
        public void   setAvailabilityWindows(String aw)    { this.availabilityWindows = aw; }
    }

    // ── Update Request (all optional – PATCH-friendly) ──────────────────────────

    public static class UpdateRequest {

        private String         name;
        private String         type;

        @Min(value = 1, message = "Capacity must be at least 1")
        private Integer        capacity;   // Integer (nullable) so PATCH can omit it

        private String         location;
        private String         availabilityWindows;
        private ResourceStatus status;

        public UpdateRequest() {}

        public UpdateRequest(String name, String type, Integer capacity,
                             String location, String availabilityWindows,
                             ResourceStatus status) {
            this.name                = name;
            this.type                = type;
            this.capacity            = capacity;
            this.location            = location;
            this.availabilityWindows = availabilityWindows;
            this.status              = status;
        }

        public String         getName()                 { return name; }
        public void           setName(String name)      { this.name = name; }

        public String         getType()                 { return type; }
        public void           setType(String type)      { this.type = type; }

        public Integer        getCapacity()             { return capacity; }
        public void           setCapacity(Integer c)    { this.capacity = c; }

        public String         getLocation()             { return location; }
        public void           setLocation(String loc)   { this.location = loc; }

        public String         getAvailabilityWindows()           { return availabilityWindows; }
        public void           setAvailabilityWindows(String aw)  { this.availabilityWindows = aw; }

        public ResourceStatus getStatus()               { return status; }
        public void           setStatus(ResourceStatus s){ this.status = s; }
    }

    // ── Response ────────────────────────────────────────────────────────────────

    public static class Response {

        private Long           id;
        private String         name;
        private String         type;
        private int            capacity;
        private String         location;
        private String         availabilityWindows;
        private ResourceStatus status;

        public Response() {}

        public Response(Long id, String name, String type, int capacity,
                        String location, String availabilityWindows,
                        ResourceStatus status) {
            this.id                  = id;
            this.name                = name;
            this.type                = type;
            this.capacity            = capacity;
            this.location            = location;
            this.availabilityWindows = availabilityWindows;
            this.status              = status;
        }

        public Long           getId()                            { return id; }
        public void           setId(Long id)                     { this.id = id; }

        public String         getName()                          { return name; }
        public void           setName(String name)               { this.name = name; }

        public String         getType()                          { return type; }
        public void           setType(String type)               { this.type = type; }

        public int            getCapacity()                      { return capacity; }
        public void           setCapacity(int c)                 { this.capacity = c; }

        public String         getLocation()                      { return location; }
        public void           setLocation(String loc)            { this.location = loc; }

        public String         getAvailabilityWindows()           { return availabilityWindows; }
        public void           setAvailabilityWindows(String aw)  { this.availabilityWindows = aw; }

        public ResourceStatus getStatus()                        { return status; }
        public void           setStatus(ResourceStatus s)        { this.status = s; }
    }
}

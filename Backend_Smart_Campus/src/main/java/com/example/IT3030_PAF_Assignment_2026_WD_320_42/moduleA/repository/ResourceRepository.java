// package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.repository;

// import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.Resource;
// import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.ResourceStatus;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.stereotype.Repository;
// import java.util.List;

// @Repository
// public interface ResourceRepository extends JpaRepository<Resource, Long> {

//     // search by type (e.g. LAB, LECTURE_HALL)
//     List<Resource> findByType(String type);

//     // search by location (e.g. Block A)
//     List<Resource> findByLocation(String location);

//     // search by status (ACTIVE or OUT_OF_SERVICE)
//     List<Resource> findByStatus(ResourceStatus status);

//     // search by both type and location together
//     List<Resource> findByTypeAndLocation(String type, String location);
// }

package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.Resource;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.ResourceStatus;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByType(String type);

    // ✅ Fix: partial match, case-insensitive
    List<Resource> findByLocationContainingIgnoreCase(String location);

    List<Resource> findByStatus(ResourceStatus status);

    // ✅ Fix: partial location match
    List<Resource> findByTypeAndLocationContainingIgnoreCase(String type, String location);
}
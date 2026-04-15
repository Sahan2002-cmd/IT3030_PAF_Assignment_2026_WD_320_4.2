package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA;

import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.dto.ResourceDTO;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.Resource;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.ResourceStatus;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.repository.ResourceRepository;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.service.ResourceService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private ResourceService resourceService;

    private Resource sampleResource;

    @BeforeEach
    void setUp() {
        sampleResource = new Resource();
        sampleResource.setId(1L);
        sampleResource.setName("Lab A101");
        sampleResource.setType("LAB");
        sampleResource.setCapacity(30);
        sampleResource.setLocation("Block A");
        sampleResource.setAvailabilityWindows("08:00-18:00");
        sampleResource.setStatus(ResourceStatus.ACTIVE);
    }

    // ── CREATE ────────────────────────────────────────────────────────────────────

    @Test
    void createResource_shouldReturnResponse_whenValidRequest() {
        ResourceDTO.CreateRequest req = new ResourceDTO.CreateRequest(
                "Lab A101", "LAB", 30, "Block A", "08:00-18:00");

        when(resourceRepository.save(any(Resource.class))).thenReturn(sampleResource);

        ResourceDTO.Response response = resourceService.createResource(req);

        assertThat(response.getName()).isEqualTo("Lab A101");
        assertThat(response.getStatus()).isEqualTo(ResourceStatus.ACTIVE);
        verify(resourceRepository, times(1)).save(any(Resource.class));
    }

    // ── READ ALL ──────────────────────────────────────────────────────────────────

    @Test
    void getAllResources_shouldReturnListOfResponses() {
        when(resourceRepository.findAll()).thenReturn(List.of(sampleResource));

        List<ResourceDTO.Response> result = resourceService.getAllResources();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Lab A101");
    }

    // ── READ ONE ──────────────────────────────────────────────────────────────────

    @Test
    void getResourceById_shouldReturnResponse_whenExists() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));

        ResourceDTO.Response response = resourceService.getResourceById(1L);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void getResourceById_shouldThrow_whenNotFound() {
        when(resourceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resourceService.getResourceById(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────────

    @Test
    void updateResource_shouldApplyChanges() {
        ResourceDTO.UpdateRequest req = new ResourceDTO.UpdateRequest(
                "Updated Lab", null, null, null, null, null);

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(resourceRepository.save(any())).thenReturn(sampleResource);

        resourceService.updateResource(1L, req);

        verify(resourceRepository).save(argThat(r -> r.getName().equals("Updated Lab")));
    }

    // ── PATCH STATUS ──────────────────────────────────────────────────────────────

    @Test
    void updateStatus_shouldChangeStatus() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(resourceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ResourceDTO.Response response = resourceService.updateStatus(1L, ResourceStatus.OUT_OF_SERVICE);

        assertThat(response.getStatus()).isEqualTo(ResourceStatus.OUT_OF_SERVICE);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────────

    @Test
    void deleteResource_shouldCallDelete_whenExists() {
        when(resourceRepository.existsById(1L)).thenReturn(true);

        resourceService.deleteResource(1L);

        verify(resourceRepository).deleteById(1L);
    }

    @Test
    void deleteResource_shouldThrow_whenNotFound() {
        when(resourceRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> resourceService.deleteResource(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ── SEARCH ────────────────────────────────────────────────────────────────────

    @Test
    void searchResources_byType_shouldReturnFiltered() {
        when(resourceRepository.findByType("LAB")).thenReturn(List.of(sampleResource));

        List<ResourceDTO.Response> result = resourceService.searchResources("LAB", null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getType()).isEqualTo("LAB");
    }

    @Test
    void searchResources_noFilters_shouldReturnAll() {
        when(resourceRepository.findAll()).thenReturn(List.of(sampleResource));

        List<ResourceDTO.Response> result = resourceService.searchResources(null, null, null);

        assertThat(result).hasSize(1);
    }
}

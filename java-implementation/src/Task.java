import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

public class Task implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private final int id;
    private String description;
    private String category;
    private TaskStatus status;
    private String assignedUser;
    private final LocalDateTime createdDate;
    private LocalDateTime completedDate;

    public enum TaskStatus {
        PENDING("Pending"),
        COMPLETED("Completed");
        
        private final String displayName;
        
        TaskStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }

    public Task(int id, String description, String category, String assignedUser) {
        this.id = id;
        this.description = Objects.requireNonNull(description, "Description cannot be null");
        this.category = Objects.requireNonNull(category, "Category cannot be null");
        this.status = TaskStatus.PENDING;
        this.assignedUser = Objects.requireNonNull(assignedUser, "Assigned user cannot be null");
        this.createdDate = LocalDateTime.now();
    }

    public void markCompleted() {
        this.status = TaskStatus.COMPLETED;
        this.completedDate = LocalDateTime.now();
    }

    @Override
    public String toString() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String dateInfo = " (Created: " + createdDate.format(formatter);
        
        if (status == TaskStatus.COMPLETED && completedDate != null) {
            dateInfo += ", Completed: " + completedDate.format(formatter);
        }
        dateInfo += ")";
        
        return id + ". [" + status.getDisplayName() + "] " + description + 
               " (Category: " + category + ") - Assigned to: " + assignedUser + dateInfo;
    }
    
    public int getId() {
        return id;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = Objects.requireNonNull(description, "Description cannot be null");
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = Objects.requireNonNull(category, "Category cannot be null");
    }
    
    public TaskStatus getStatus() {
        return status;
    }
    
    public String getAssignedUser() {
        return assignedUser;
    }
    
    public void setAssignedUser(String assignedUser) {
        this.assignedUser = Objects.requireNonNull(assignedUser, "Assigned user cannot be null");
    }
    
    public LocalDateTime getCreatedDate() {
        return createdDate;
    }
    
    public LocalDateTime getCompletedDate() {
        return completedDate;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Task task = (Task) o;
        return id == task.id;
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

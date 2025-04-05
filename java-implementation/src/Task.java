import java.io.Serializable;

public class Task implements Serializable {
    int id;
    String description;
    String category;
    String status; // "Pending" or "Completed"
    String assignedUser;

    public Task(int id, String description, String category, String assignedUser) {
        this.id = id;
        this.description = description;
        this.category = category;
        this.status = "Pending";
        this.assignedUser = assignedUser;
    }

    public void markCompleted() {
        this.status = "Completed";
    }

    public String toString() {
        return id + ". [" + status + "] " + description + " (" + category + ") - Assigned to: " + assignedUser;
    }
    
    public String getStatus() {
        return status;
    }
}
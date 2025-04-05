import java.io.Serializable;
import java.util.Objects;

public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private final String username;
    private String displayName;
    private String email;

    public User(String username) {
        this.username = Objects.requireNonNull(username, "Username cannot be null");
        this.displayName = username;
    }

    public User(String username, String displayName, String email) {
        this.username = Objects.requireNonNull(username, "Username cannot be null");
        this.displayName = displayName != null ? displayName : username;
        this.email = email;
    }
    
    public String getUsername() {
        return username;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName != null ? displayName : username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    @Override
    public String toString() {
        return displayName + " (" + username + ")";
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return username.equals(user.username);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(username);
    }
}
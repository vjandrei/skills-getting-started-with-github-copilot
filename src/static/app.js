document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear previous options but keep the placeholder option
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build the basic content
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const header = document.createElement("div");
        header.className = "participants-header";
        const count = document.createElement("span");
        count.className = "participants-count";
        count.textContent = `${details.participants.length}`;
        header.appendChild(document.createTextNode("Participants"));
        header.appendChild(count);

        participantsSection.appendChild(header);

        // If there are participants, show a styled list, otherwise a friendly empty message.
        if (details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          // Helper to convert email to display name
          const prettifyName = (email) => {
            const local = String(email || "").split("@")[0];
            const words = local.replace(/[\._]+/g, " ").split(" ");
            return words
              .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
              .join(" ");
          };

          // Helper to get initials
          const initialsFor = (name) => {
            const parts = name.split(" ").filter(Boolean);
            if (parts.length === 0) return "?";
            if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
            return (parts[0][0] + parts[1][0]).toUpperCase();
          };

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const displayName = prettifyName(p);
            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            avatar.textContent = initialsFor(displayName);

            const nameSpan = document.createElement("span");
            nameSpan.textContent = displayName || p;


            // Delete icon button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "participant-delete-btn";
            deleteBtn.title = "Remove participant";
            deleteBtn.innerHTML = "&#128465;"; // Trash can icon
            deleteBtn.style.marginLeft = "auto";
            deleteBtn.style.background = "none";
            deleteBtn.style.border = "none";
            deleteBtn.style.color = "#c62828";
            deleteBtn.style.fontSize = "18px";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.padding = "4px 8px";

            // Add click handler to unregister participant
            deleteBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  { method: "POST" }
                );
                const result = await response.json();
                if (response.ok) {
                  // Refresh activities list
                  fetchActivities();
                } else {
                  alert(result.detail || "Failed to unregister participant.");
                }
              } catch (error) {
                alert("Failed to unregister participant. Please try again.");
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const empty = document.createElement("div");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet — be the first to sign up!";
          participantsSection.appendChild(empty);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

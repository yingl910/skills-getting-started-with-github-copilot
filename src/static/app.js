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

      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants markup
        const participants = details.participants || [];
        let participantsHtml = "";
        if (participants.length > 0) {
          participantsHtml =
            "<ul class='participants-list'>" +
            participants
              .map((p) => {
                const namePart = String(p).split("@")[0] || "";
                const initials = namePart
                  .split(/[\._-]/)
                  .map((s) => (s ? s[0] : ""))
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                // Add a delete button with data attributes so we know which activity/email to remove
                return `<li><span class="participant-badge">${initials}</span><span class="participant-email">${p}</span><button class="participant-delete" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">×</button></li>`;
              })
              .join("") +
            "</ul>";
        } else {
          participantsHtml = `<p class="no-participants">No participants yet</p>`;
        }

        // Event delegation for delete buttons
        // Ensure we only add one listener
        if (!activitiesList._participantDeleteHandlerAdded) {
          activitiesList.addEventListener("click", async (event) => {
            const btn = event.target.closest(".participant-delete");
            if (!btn) return;

            const activity = btn.getAttribute("data-activity");
            const email = btn.getAttribute("data-email");

            if (!activity || !email) return;

            if (!confirm(`Unregister ${email} from ${activity}?`)) return;

            try {
              const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: "POST" });
              const result = await response.json();

              if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");

                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 4000);

                // Refresh the list
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "An error occurred";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            } catch (error) {
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering:", error);
            }
          });

          activitiesList._participantDeleteHandlerAdded = true;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${participantsHtml}
          </div>
        `;

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

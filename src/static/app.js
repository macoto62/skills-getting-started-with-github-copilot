document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper function to refresh activities
  async function refreshActivities() {
    activitiesList.innerHTML = "<p>Refreshing...</p>";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    await fetchActivities();
  }

  // Clear and repopulate activities list
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";

      Object.entries(activities).forEach(([name, details]) => {
        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list HTML with delete buttons
        const participantsList = details.participants.length > 0
          ? `<ul class="participants-list">\n              ${details.participants.map(email => `
                <li class="participant-item">
                  <span class="participant-email">${email}</span>
                  <button class="delete-participant" data-activity="${name}" data-email="${email}" aria-label="Remove ${email} from ${name}" title="Remove">
                    <svg class="icon-trash" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" fill="none"/>
                      <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </li>
              `).join('')}\n            </ul>`
          : `<p class="no-participants">No participants yet - be the first to sign up!</p>`;

        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants:</strong></p>
            ${participantsList}
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
        await refreshActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate click for participant delete buttons
  activitiesList.addEventListener("click", async (event) => {
    const button = event.target.closest(".delete-participant");
    if (!button) return;

    const activity = button.dataset.activity;
    const email = button.dataset.email;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message || "Participant removed";
        messageDiv.className = "success";
        // Refresh list to update spots and participants
        await refreshActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to remove participant";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Reset dropdown before initial load to avoid duplicates on rerenders
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
  fetchActivities();
});

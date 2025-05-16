document.querySelectorAll(".event-type-btn").forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    document
      .querySelectorAll(".event-type-btn")
      .forEach((btn) => btn.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");
    // Update hidden input value
    document.getElementById("eventType").value =
      button.getAttribute("data-event");
  });
});

document.getElementById("submitEvent").addEventListener("click", async () => {
  // Show loading spinner
  document.getElementById("submitText").style.display = "none";
  document.getElementById("submitSpinner").style.display = "inline-block";

  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const eventType = document.getElementById("eventType").value;
  const eventDate = document.getElementById("eventDate").value;
  const guestCount = document.getElementById("guestCount").value;
  const specialRequests = document.getElementById("specialRequests").value;

  const payload = {
    firstName,
    lastName,
    email,
    phone,
    eventType,
    eventDate,
    guestCount,
    specialRequests,
  };

  try {
    const response = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // Hide loading spinner
    document.getElementById("submitText").style.display = "inline-block";
    document.getElementById("submitSpinner").style.display = "none";

    if (response.ok) {
      // Reset form
      document.getElementById("eventForm").reset();

      // Show success status
      document.getElementById("statusText").textContent = result.message;
      document.getElementById("apiStatus").style.display = "block";

      // If there's a note about in-memory storage, add it to the status
      if (result.note) {
        document.getElementById(
          "statusText"
        ).innerHTML = `${result.message}<br><small>${result.note}</small>`;
      }

      // Update booking details in confirmation modal
      let bookingDetails = `
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Event Type:</strong> ${eventType}</p>
        <p><strong>Date:</strong> ${new Date(
          eventDate
        ).toLocaleDateString()}</p>
        <p><strong>Guests:</strong> ${guestCount}</p>
      `;
      document.getElementById("bookingDetails").innerHTML = bookingDetails;

      // Show confirmation modal
      const confirmationModal = new bootstrap.Modal(
        document.getElementById("confirmationModal")
      );
      confirmationModal.show();

      setTimeout(() => {
        document.getElementById("apiStatus").style.display = "none";
      }, 3000);
    } else {
      alert("Submission failed: " + result.message);
    }
  } catch (err) {
    // Hide loading spinner on error
    document.getElementById("submitText").style.display = "inline-block";
    document.getElementById("submitSpinner").style.display = "none";

    alert(
      "An error occurred while submitting the form. Please check your connection and try again."
    );
  }
});

async function fetchDeepLink() {
  const response = await fetch("/generate-link", { method: "POST" });
  const data = await response.json();
  return data.deepLink;
}

document.getElementById("verifyBtn").addEventListener("click", async () => {
  try {
    const deepLink = await fetchDeepLink();
    if (deepLink) {
      window.location.href = deepLink;
    } else {
      alert("Failed to generate deep link");
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong");
  }
});

// new listener for QR button
document.getElementById("qrBtn").addEventListener("click", async () => {
  try {
    const deepLink = await fetchDeepLink();
    if (deepLink) {
      const container = document.getElementById("qrContainer");
      container.innerHTML = ""; // clear previous
      // generate QR code using library
      new QRCode(container, {
        text: deepLink,
        width: 300,
        height: 300
      });
    } else {
      alert("Failed to generate deep link");
    }
  } catch (error) {
    console.error(error);
    alert("Unable to create QR");
  }
});

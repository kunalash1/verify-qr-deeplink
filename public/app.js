document.getElementById("verifyBtn").addEventListener("click", async () => {
  try {
    const response = await fetch("/generate-link", {
      method: "POST"
    });

    const data = await response.json();
    console.log(data)

    if (data.deepLink) {
      window.location.href = data.deepLink;
    } else {
      alert("Failed to generate deep link");
    }

  } catch (error) {
    console.error(error);
    alert("Something went wrong");
  }
});

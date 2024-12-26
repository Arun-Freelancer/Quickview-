const modalBtns = document.querySelectorAll(".quick_buy--button");
const modal = document.querySelector("#quick_buy--modal");
const modalContent = document.querySelector(".quick_buy--product_popup");
const closeModalBtn = document.querySelector(".close-modal");

modalBtns.forEach((button) => {
  button.addEventListener("click", () => {
    const productHandle = button.getAttribute("data-handle");

    modal.classList.add("active");
    document.body.classList.add("quick_buy_modal--active");

    fetch(`/products/${productHandle}?section_id=quick-view`)
      .then((response) => response.text())
      .then((sectionHtml) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(sectionHtml, "text/html");
        const sectionContent = doc.querySelector(".quick-view-content");
        modalContent.innerHTML = sectionContent.innerHTML;
        modal.classList.remove("loading");
        setTimeout(() => {
          initVariantPickers();
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching section:", error);
      });
  });
});

closeModalBtn.addEventListener("click", () => {
  modal.classList.remove("active"); // Close modal
  document.body.classList.remove("quick_buy_modal--active");
  modal.classList.add("loading");
  modalContent.innerHTML = "";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
    document.body.classList.remove("quick_buy_modal--active");
    modal.classList.add("loading");
    modalContent.innerHTML = "";
  }
});

document.body.addEventListener("click", (event) => {
  // Handle quantity increase
  const productATC = event.target.closest(".quick_buy--atc-section");
  if (event.target && event.target.dataset.action === "increase-quantity") {
    event.preventDefault();
    const quantityInput = productATC.querySelector(
      ".QuantitySelector__CurrentQuantity"
    );
    let currentQuantity = parseInt(quantityInput.value);
    quantityInput.value = currentQuantity + 1;
  }

  // Handle quantity decrease
  if (event.target && event.target.dataset.action === "decrease-quantity") {
    event.preventDefault();

    const quantityInput = productATC.querySelector(
      ".QuantitySelector__CurrentQuantity"
    );
    let currentQuantity = parseInt(quantityInput.value);
    if (currentQuantity > 1) {
      quantityInput.value = currentQuantity - 1;
    }
  }

  if (event.target && event.target.id === "quick_buy--atc_button") {
    event.preventDefault();
    const quantityInput = productATC.querySelector(
      ".QuantitySelector__CurrentQuantity"
    );

    const variant_id = document.querySelector("#quick_variant--id").value;
    const quantity = parseInt(quantityInput.value);

    let formData = {
      items: [
        {
          id: variant_id,
          quantity: quantity,
        },
      ],
    };

    fetch(window.Shopify.routes.root + "cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        document.documentElement.dispatchEvent(
          new CustomEvent("cart:refresh", {
            bubbles: true,
          })
        );

        modal.classList.remove("active");
        document.body.classList.remove("quick_buy_modal--active");
        modal.classList.add("loading");
        document
          .querySelector(
            '[data-action="open-drawer"][data-drawer-id="sidebar-cart"]'
          )
          .click();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
});

// Initialize variant pickers for initial products
initVariantPickers();

function initVariantPickers() {
  console.log("loaded");

  const quickBuyProduct = document.querySelector(".quick_buy--form");

  const variantInput = quickBuyProduct.querySelector('[name="id"]');

  const getVariantData = () => {
    try {
      return JSON.parse(quickBuyProduct.dataset.productVariants);
    } catch (error) {
      console.error("Error parsing variant data:", error);
      return [];
    }
  };

  const getSelectedOptions = () => {
    return Array.from(
      quickBuyProduct.querySelectorAll(".selector-wrapper input"),
      (input) => (input.checked ? input.value : null)
    ).filter(Boolean); // Filter out `null` values (unchecked inputs)
  };

  const updateMasterId = () => {
    const options = getSelectedOptions();

    // Find the current variant that matches the selected options
    const currentVariant = getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => options[index] === option)
        .includes(false);
    });

    return currentVariant || null;
  };

  const updateVariantStatuses = () => {
    const variantData = getVariantData();
    const selectedOptions = getSelectedOptions(); // Get currently selected options (e.g., ['Red', 'M', ...])

    // Select all selector wrappers dynamically
    const selectorWrappers =
      quickBuyProduct.querySelectorAll(".selector-wrapper");

    selectorWrappers.forEach((wrapper, index) => {
      const inputs = wrapper.querySelectorAll('input[type="radio"]');
      const selectedOptionValue = selectedOptions[index]; // Get the selected option value for the current wrapper

      if (selectedOptionValue) {
        // Determine available options based on currently selected values
        let availableOptions = [];
        if (index === 0) {
          // First option (e.g., Color)
          availableOptions = variantData
            .filter(
              (variant) =>
                variant.available &&
                variant[`option${index + 2}`] === selectedOptions[1]
            ) // Adjust to next option
            .map((variant) => variant[`option${index + 1}`]); // Map back to first option
        } else {
          availableOptions = variantData
            .filter(
              (variant) =>
                variant.available &&
                variant[`option${index}`] === selectedOptions[index - 1]
            ) // Adjust to previous option
            .map((variant) => variant[`option${index + 1}`]); // Map to current option
        }

        // Update the availability of the current options
        inputs.forEach((input) => {
          const optionValue = input.value;
          const isAvailable = availableOptions.includes(optionValue);

          input.classList.toggle("disabled", !isAvailable);
          input.disabled = !isAvailable; // Disable the input if not available
        });
      }
    });
  };

  // Add change event listeners to all radio inputs within this upsell product
  const radios = quickBuyProduct.querySelectorAll('input[type="radio"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const currentVariant = updateMasterId();
      console.log(currentVariant);
      if (currentVariant) {
        // Show loading state
        const imageElement = document.querySelector(".product_media");
        const quickBuyMedia = document.querySelector(".quick_buy--media"); // Make sure this element exists

        // Show the loading indicator
        quickBuyMedia && quickBuyMedia.classList.add("loading");

        // Update hidden variant input field
        document.querySelector("#quick_variant--id").value = currentVariant.id;

        // Create a temporary image element to handle loading state
        const tempImg = new Image();
        tempImg.src = currentVariant.featured_image.src;

        // When the image is fully loaded, update the main image and hide the loading indicator
        tempImg.onload = () => {
          imageElement.setAttribute("src", currentVariant.featured_image.src);
          imageElement.setAttribute(
            "srcset",
            currentVariant.featured_image.src
          );

          quickBuyMedia && quickBuyMedia.classList.remove("loading");
        };
      }

      updateVariantStatuses();
    });
  });

  // Initial call to set availability based on default selections
  updateVariantStatuses();
}

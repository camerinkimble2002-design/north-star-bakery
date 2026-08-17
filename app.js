/* =========================================================
   North Star Bakery — app.js
   Touchstone 4: interactive pre-order builder, browser
   storage, and contact form validation.

   Loaded on every page. Each section below only runs if the
   matching elements exist on the current page, so this one
   file can safely be shared across index/products/about/
   contact.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. DATA — products available to pre-order.
     An array of objects: this is one of our two required
     data structures.
     --------------------------------------------------------- */
  const PRODUCTS = [
    { id: "classic-sourdough", name: "Classic Sourdough", category: "Breads", price: 8 },
    { id: "seeded-multigrain", name: "Seeded Multigrain", category: "Breads", price: 9 },
    { id: "dinner-rolls", name: "Soft Dinner Rolls (half-dozen)", category: "Breads", price: 7 },
    { id: "signature-loaf", name: "North Star Boule (Signature)", category: "Breads", price: 9 },
    { id: "butter-croissant", name: "Butter Croissant", category: "Pastries", price: 4.5 },
    { id: "seasonal-galette", name: "Seasonal Galette", category: "Pastries", price: 7 },
    { id: "morning-bun", name: "Morning Bun", category: "Pastries", price: 5.5 },
    { id: "birthday-cake", name: "Birthday Layer Cake", category: "Cakes", price: 55 },
    { id: "sheet-cake", name: "Celebration Sheet Cake", category: "Cakes", price: 80 },
  ];

  const STORAGE_KEY = "northStarBakery.preOrder";

  /* ---------------------------------------------------------
     2. CART STORAGE — localStorage helpers.
     The cart itself is an array of objects: { id, qty }.
     This is our second required data structure (a second
     array of objects), kept separate from PRODUCTS above.
     --------------------------------------------------------- */

  function loadCart() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Could not read saved pre-order:", err);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn("Could not save pre-order:", err);
    }
  }

  function getQty(cart, productId) {
    const entry = cart.find(function (item) {
      return item.id === productId;
    });
    return entry ? entry.qty : 0;
  }

  function setQty(cart, productId, qty) {
    const clamped = Math.max(0, Math.min(20, qty));
    const existing = cart.find(function (item) {
      return item.id === productId;
    });
    if (existing) {
      existing.qty = clamped;
    } else if (clamped > 0) {
      cart.push({ id: productId, qty: clamped });
    }
    // remove any zero-quantity entries so the cart stays tidy
    return cart.filter(function (item) {
      return item.qty > 0;
    });
  }

  function cartTotalItems(cart) {
    return cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function cartTotalPrice(cart) {
    return cart.reduce(function (sum, item) {
      const product = PRODUCTS.find(function (p) {
        return p.id === item.id;
      });
      return sum + (product ? product.price * item.qty : 0);
    }, 0);
  }

  function formatCurrency(amount) {
    return "$" + amount.toFixed(2);
  }

  /* ---------------------------------------------------------
     3. NAV BADGE — shows the pre-order item count on every
     page's navigation, so the selection is visibly carried
     across pages (index, products, about, contact).
     --------------------------------------------------------- */

  function renderNavBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const cart = loadCart();
    const count = cartTotalItems(cart);
    if (count > 0) {
      badge.textContent = String(count);
      badge.hidden = false;
    } else {
      badge.textContent = "";
      badge.hidden = true;
    }
  }

  /* ---------------------------------------------------------
     4. PRODUCTS PAGE — quantity steppers + live order summary.
     Only runs if the page has the pre-order UI in it.
     --------------------------------------------------------- */

  function initProductOrderBuilder() {
    const stepperButtons = document.querySelectorAll("[data-step]");
    const summaryPanel = document.getElementById("order-summary");
    if (stepperButtons.length === 0 || !summaryPanel) return;

    let cart = loadCart();

    function refresh() {
      // update every quantity display on the page
      PRODUCTS.forEach(function (product) {
        const qtyEl = document.querySelector(
          '[data-qty-for="' + product.id + '"]'
        );
        if (qtyEl) qtyEl.textContent = String(getQty(cart, product.id));
      });
      renderOrderSummary(cart, summaryPanel);
      renderNavBadge();
    }

    stepperButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const productId = button.getAttribute("data-product-id");
        const direction = button.getAttribute("data-step") === "up" ? 1 : -1;
        const currentQty = getQty(cart, productId);
        cart = setQty(cart, productId, currentQty + direction);
        saveCart(cart);
        refresh();
      });
    });

    summaryPanel.addEventListener("click", function (event) {
      const removeBtn = event.target.closest("[data-remove]");
      if (!removeBtn) return;
      const productId = removeBtn.getAttribute("data-remove");
      cart = setQty(cart, productId, 0);
      saveCart(cart);
      refresh();
    });

    const clearBtn = document.getElementById("clear-order");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        cart = [];
        saveCart(cart);
        refresh();
      });
    }

    refresh();
  }

  function renderOrderSummary(cart, panel) {
    const listEl = panel.querySelector("#order-summary-list");
    const emptyEl = panel.querySelector("#order-summary-empty");
    const totalEl = panel.querySelector("#order-summary-total");
    if (!listEl || !totalEl) return;

    listEl.innerHTML = "";

    if (cart.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      totalEl.textContent = "";
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    cart.forEach(function (item) {
      const product = PRODUCTS.find(function (p) {
        return p.id === item.id;
      });
      if (!product) return;

      const li = document.createElement("li");
      li.className = "order-summary-row";

      const label = document.createElement("span");
      label.textContent = item.qty + "\u00D7 " + product.name;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "order-summary-remove";
      removeBtn.setAttribute("data-remove", product.id);
      removeBtn.setAttribute("aria-label", "Remove " + product.name + " from pre-order");
      removeBtn.textContent = "Remove";

      li.appendChild(label);
      li.appendChild(removeBtn);
      listEl.appendChild(li);
    });

    totalEl.textContent =
      "Estimated total: " + formatCurrency(cartTotalPrice(cart)) +
      " (" + cartTotalItems(cart) + " item" + (cartTotalItems(cart) === 1 ? "" : "s") + ")";
  }

  /* ---------------------------------------------------------
     5. CONTACT PAGE — pre-fill item details from the saved
     pre-order, plus custom JavaScript form validation.
     --------------------------------------------------------- */

  function initContactPage() {
    const form = document.getElementById("preorder-form");
    if (!form) return;

    prefillItemDetailsFromCart();
    renderContactOrderSummary();

    const clearBtn = document.getElementById("clear-saved-order");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        saveCart([]);
        renderContactOrderSummary();
        renderNavBadge();
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const isValid = validateForm(form);
      if (isValid) {
        showFormSuccess(form);
      }
    });

    // Re-validate a field as soon as the user fixes it, so
    // errors can be corrected without resubmitting blind.
    ["name", "email", "item-details", "pickup-date"].forEach(function (id) {
      const field = document.getElementById(id);
      if (!field) return;
      field.addEventListener("input", function () {
        clearFieldError(id);
      });
    });
  }

  function prefillItemDetailsFromCart() {
    const cart = loadCart();
    const itemDetailsField = document.getElementById("item-details");
    if (!itemDetailsField || cart.length === 0) return;
    // Only auto-fill if the visitor hasn't already typed something.
    if (itemDetailsField.value.trim() !== "") return;

    const lines = cart.map(function (item) {
      const product = PRODUCTS.find(function (p) {
        return p.id === item.id;
      });
      return product ? item.qty + "x " + product.name : null;
    }).filter(Boolean);

    if (lines.length > 0) {
      itemDetailsField.value = lines.join(", ");
    }
  }

  function renderContactOrderSummary() {
    const summaryEl = document.getElementById("contact-order-summary");
    if (!summaryEl) return;
    const cart = loadCart();

    if (cart.length === 0) {
      summaryEl.innerHTML =
        '<p class="hint">No items saved from the Products page yet. ' +
        '<a href="products.html">Browse the menu</a> to build a pre-order, ' +
        "or just describe what you'd like below.</p>";
      return;
    }

    const itemsText = cart.map(function (item) {
      const product = PRODUCTS.find(function (p) {
        return p.id === item.id;
      });
      return product ? item.qty + "\u00D7 " + product.name : null;
    }).filter(Boolean).join(", ");

    summaryEl.innerHTML =
      '<p><strong>From your Products page selections:</strong> ' + itemsText + "." +
      ' We\u2019ve filled in the item details field below \u2014 feel free to edit it. ' +
      '<button type="button" id="clear-saved-order" class="button secondary" style="margin-top:0.5rem;">Clear saved order</button></p>';

    // re-bind the clear button since we just replaced it
    const clearBtn = document.getElementById("clear-saved-order");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        saveCart([]);
        renderContactOrderSummary();
        renderNavBadge();
      });
    }
  }

  /* ---------------------------------------------------------
     6. FORM VALIDATION — custom JavaScript checks with
     feedback shown right next to each field.
     --------------------------------------------------------- */

  function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + "-error");
    const fieldEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = message;
    if (fieldEl) fieldEl.setAttribute("aria-invalid", "true");
  }

  function clearFieldError(fieldId) {
    const errorEl = document.getElementById(fieldId + "-error");
    const fieldEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = "";
    if (fieldEl) fieldEl.removeAttribute("aria-invalid");
  }

  function isValidEmail(value) {
    // simple, readable email pattern — good enough for client-side UX
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isPastDate(value) {
    if (!value) return false;
    const chosen = new Date(value + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return chosen < today;
  }

  function validateForm(form) {
    let isValid = true;

    const name = form.querySelector("#name");
    const email = form.querySelector("#email");
    const itemDetails = form.querySelector("#item-details");
    const pickupDate = form.querySelector("#pickup-date");

    // 1. Required field check — name
    if (!name.value.trim()) {
      showFieldError("name", "Please tell us your name.");
      isValid = false;
    } else {
      clearFieldError("name");
    }

    // 2. Email format validation
    if (!email.value.trim()) {
      showFieldError("email", "Please enter your email address.");
      isValid = false;
    } else if (!isValidEmail(email.value.trim())) {
      showFieldError("email", "That email address doesn't look right — check for a typo.");
      isValid = false;
    } else {
      clearFieldError("email");
    }

    // 3. Minimum length check — item details
    if (itemDetails.value.trim().length < 5) {
      showFieldError("item-details", "Add a few details about what you'd like (at least 5 characters).");
      isValid = false;
    } else {
      clearFieldError("item-details");
    }

    // 4. Custom validation — pickup date can't be in the past
    if (pickupDate.value && isPastDate(pickupDate.value)) {
      showFieldError("pickup-date", "Pickup date can't be in the past — pick today or a later date.");
      isValid = false;
    } else {
      clearFieldError("pickup-date");
    }

    if (!isValid) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    }

    return isValid;
  }

  function showFormSuccess(form) {
    const successEl = document.getElementById("form-success");
    if (successEl) {
      successEl.hidden = false;
      successEl.focus();
    }
    // This is a static demo site with no backend, so "sending" the
    // request just confirms receipt and clears the saved pre-order.
    form.reset();
    saveCart([]);
    renderContactOrderSummary();
    renderNavBadge();
  }

  /* ---------------------------------------------------------
     7. RUN — wait for the DOM, then initialize whichever
     features are relevant to the current page.
     --------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", function () {
    renderNavBadge();
    initProductOrderBuilder();
    initContactPage();
  });
})();

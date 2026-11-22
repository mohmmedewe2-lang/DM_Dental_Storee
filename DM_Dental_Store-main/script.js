"use strict";

const WHATSAPP_NUMBER = "201113332734";

const STORAGE = {
  cart: "dmDentalCartV2",
  recent: "dmDentalRecentV2",
  theme: "dmDentalThemeV2"
};

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  Array.from(document.querySelectorAll(selector));

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCount(value) {
  return new Intl.NumberFormat("ar-EG")
    .format(Number(value || 0));
}

function formatPrice(value) {
  return new Intl.NumberFormat("ar-EG")
    .format(Number(value || 0));
}

const state = {
  cart: [],
  recent: [],
  category: "all",
  query: "",
  sort: "featured",
  page: 1,
  pageSize: 10
};

function loadStorage() {
  try {
    const cart =
      JSON.parse(
        localStorage.getItem(STORAGE.cart) || "[]"
      );

    const recent =
      JSON.parse(
        localStorage.getItem(STORAGE.recent) || "[]"
      );

    state.cart =
      Array.isArray(cart)
        ? cart.map(item => {
            if (
              item &&
              Number(item.id) === 53 &&
              item.options
            ) {
              return {
                ...item,
                id: "custom-teeth"
              };
            }

            return item;
          })
        : [];

    state.recent =
      Array.isArray(recent)
        ? recent
            .map(Number)
            .filter(Number.isFinite)
        : [];

  } catch (error) {
    console.error(
      "Storage loading error:",
      error
    );

    state.cart = [];
    state.recent = [];
  }
}

function saveStorage() {
  try {
    localStorage.setItem(
      STORAGE.cart,
      JSON.stringify(state.cart)
    );

    localStorage.setItem(
      STORAGE.recent,
      JSON.stringify(state.recent)
    );

  } catch (error) {
    console.error(
      "Storage saving error:",
      error
    );
  }
}

function getProductCards() {
  return $$(".product-card");
}

function getProduct(id) {
  const idString = String(id);

  if (idString === "custom-teeth") {
    const teethImage =
      document.querySelector(
        "#teeth-options .teeth-gallery img"
      )?.getAttribute("src") || "";

    const customPrice =
      Number(
        document
          .querySelector("#teeth-options")
          ?.dataset.price || 0
      );

    return {
      id: "custom-teeth",
      title:
        "أسنان صناعية حسب الاختيار",
      name:
        "أسنان صناعية حسب الاختيار",
      description:
        "منتج أسنان صناعية يتم تحديد النوع والاتجاه والمقاس والكمية من قسم الاختيارات.",
      category:
        "teeth",
      categoryLabel:
        "أسنان صناعية",
      image:
        teethImage,
      price:
        customPrice
    };
  }

  const numericId =
    Number(id);

  const card =
    getProductCards().find(
      item =>
        Number(item.dataset.id) ===
        numericId
    );

  if (!card) {
    return null;
  }

  const image =
    card.querySelector(
      ".product-image img"
    )?.getAttribute("src") ||
    "";

  const title =
    card.querySelector("h3")
      ?.textContent
      ?.trim() ||
    card.dataset.name ||
    "منتج";

  const description =
    card.querySelector("p")
      ?.textContent
      ?.trim() ||
    "";

  const categoryLabel =
    card.querySelector(
      ".product-category"
    )
      ?.textContent
      ?.trim() ||
    "";

  const price =
    Number(
      card.dataset.price || 0
    );

  return {
    id:
      numericId,

    title:
      title,

    name:
      title,

    description:
      description,

    category:
      card.dataset.category ||
      "all",

    categoryLabel:
      categoryLabel,

    image:
      image,

    price:
      price
  };
}

function updateCardPrices() {
  getProductCards()
    .forEach(card => {
      const priceElement =
        card.querySelector(
          ".price-value"
        );

      if (!priceElement) {
        return;
      }

      const price =
        Number(
          card.dataset.price || 0
        );

      priceElement.textContent =
        formatPrice(price);
    });
}

function getCardQuantity(id) {
  return state.cart
    .filter(item =>
      Number(item.id) ===
        Number(id) &&
      !item.options
    )
    .reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );
}

function updateCardQuantities() {
  $$("[data-card-quantity]")
    .forEach(output => {
      const id =
        output.dataset.cardQuantity;

      output.textContent =
        formatCount(
          getCardQuantity(id)
        );
    });

  $$("[data-card-qty]")
    .forEach(button => {
      const id =
        button.dataset.cardQty;

      const quantity =
        getCardQuantity(id);

      const delta =
        Number(
          button.dataset.delta
        );

      const isMinus =
        delta < 0;

      button.disabled =
        isMinus &&
        quantity <= 0;

      button.setAttribute(
        "aria-disabled",
        String(
          button.disabled
        )
      );
    });
}

function cartQuantity() {
  return state.cart.reduce(
    (sum, item) =>
      sum +
      Number(
        item.quantity || 0
      ),
    0
  );
}

function addToCart(id) {
  const product =
    getProduct(id);

  if (!product) {
    showToast(
      "تعذر العثور على المنتج"
    );

    return;
  }

  const existing =
    state.cart.find(
      item =>
        String(item.id) ===
          String(product.id) &&
        !item.options
    );

  if (existing) {
    existing.quantity =
      Number(
        existing.quantity || 0
      ) + 1;

  } else {
    state.cart.push({
      id:
        product.id,

      quantity:
        1
    });
  }

  saveStorage();

  renderCart();

  showToast(
    `تمت إضافة ${product.title} إلى السلة`
  );
}

function changeQuantity(
  key,
  delta
) {
  const item =
    state.cart.find(
      entry =>
        String(
          entry.uid ||
          entry.id
        ) ===
        String(key)
    );

  if (!item) {
    return;
  }

  item.quantity =
    Number(
      item.quantity || 0
    ) +
    Number(delta);

  if (
    item.quantity <= 0
  ) {
    state.cart =
      state.cart.filter(
        entry =>
          String(
            entry.uid ||
            entry.id
          ) !==
          String(key)
      );
  }

  saveStorage();

  renderCart();
}

function removeFromCart(key) {
  state.cart =
    state.cart.filter(
      item =>
        String(
          item.uid ||
          item.id
        ) !==
        String(key)
    );

  saveStorage();

  renderCart();

  showToast(
    "تم حذف المنتج من السلة"
  );
}

function calculateCartTotal() {
  return state.cart.reduce(
    (total, item) => {
      const product =
        getProduct(item.id);

      if (!product) {
        return total;
      }

      const quantity =
        Number(
          item.quantity || 0
        );

      const price =
        Number(
          product.price || 0
        );

      return (
        total +
        price * quantity
      );
    },
    0
  );
}

function updateStickyCart() {
  const count = cartQuantity();
  const summary = $("#mobileCartSummary");
  const countEl = $("#mobileCartCount");
  const totalEl = $("#mobileCartTotal");
  const openButton = $("#mobileCartOpen");

  if (summary) summary.classList.toggle("hidden", count === 0);
  if (countEl) countEl.textContent = formatCount(count);
  if (totalEl) totalEl.textContent = `${formatPrice(calculateCartTotal())} جنيه`;

  if (openButton && !openButton.dataset.bound) {
    openButton.dataset.bound = "true";
    openButton.addEventListener("click", openCart);
  }
}


function renderCart() {
  const count =
    cartQuantity();

  // Keep the sticky cart synchronized after every add, remove, or quantity change.
  updateStickyCart();

  const cartCount =
    $("#cartCount");

  if (cartCount) {
    cartCount.textContent =
      formatCount(count);
  }

  const drawerItemCount =
    $("#drawerItemCount");

  if (drawerItemCount) {
    drawerItemCount.textContent =
      `(${formatCount(count)})`;
  }

  const cartItems =
    $("#cartItems");

  if (!cartItems) {
    console.error(
      "Element #cartItems not found"
    );

    return;
  }

  const empty =
    state.cart.length === 0;

  const cartEmpty =
    $("#cartEmpty");

  if (cartEmpty) {
    cartEmpty.classList.toggle(
      "hidden",
      !empty
    );
  }

  const drawerFooter =
    $("#drawerFooter");

  if (drawerFooter) {
    drawerFooter.classList.toggle(
      "hidden",
      empty
    );
  }

  cartItems.classList.toggle(
    "hidden",
    empty
  );

  if (empty) {
    cartItems.innerHTML = "";

    const subtotal =
      $("#cartSubtotal");

    if (subtotal) {
      subtotal.textContent =
        "0 جنيه";
    }

    updateCardQuantities();

    return;
  }

  cartItems.innerHTML =
    state.cart
      .map(item => {
        const product =
          getProduct(item.id);

        if (!product) {
          return "";
        }

        const key =
          String(
            item.uid ||
            item.id
          );

        const quantity =
          Number(
            item.quantity || 0
          );

        const itemTotal =
          Number(
            product.price || 0
          ) *
          quantity;

        let optionLine =
          "";

        if (item.options) {
          optionLine = `
            <small>
              ${escapeHTML(
                item.options.type ||
                ""
              )}
              ·
              ${escapeHTML(
                item.options.direction ||
                ""
              )}
              ·
              ${escapeHTML(
                item.options.size ||
                ""
              )}
            </small>
          `;
        } else {
          optionLine = `
            <small>
              ${escapeHTML(
                product.name
              )}
            </small>
          `;
        }

        return `
          <div
            class="cart-line"
            data-cart-key="${escapeHTML(key)}"
          >

            ${
              product.image
                ? `
                  <img
                    src="${escapeHTML(
                      product.image
                    )}"
                    alt="${escapeHTML(
                      product.title
                    )}"
                    loading="lazy"
                  >
                `
                : `
                  <div
                    class="cart-line-image-placeholder"
                    aria-hidden="true"
                  >
                    🦷
                  </div>
                `
            }

            <div class="cart-line-info">

              <h4>
                ${
                  item.options
                    ? "أسنان صناعية حسب الاختيار"
                    : escapeHTML(
                        product.title
                      )
                }
              </h4>

              ${optionLine}

              <div class="cart-item-price">
                ${formatPrice(
                  product.price
                )}
                جنيه
              </div>

              <div class="cart-line-bottom">

                <div
                  class="quantity-control"
                  aria-label="تغيير الكمية"
                >

                  <button
                    type="button"
                    data-qty="${escapeHTML(key)}"
                    data-delta="-1"
                    aria-label="تقليل الكمية"
                  >
                    −
                  </button>

                  <span>
                    ${formatCount(
                      quantity
                    )}
                  </span>

                  <button
                    type="button"
                    data-qty="${escapeHTML(key)}"
                    data-delta="1"
                    aria-label="زيادة الكمية"
                  >
                    +
                  </button>

                </div>

                <strong class="cart-item-total">
                  ${formatPrice(
                    itemTotal
                  )}
                  جنيه
                </strong>

              </div>

            </div>

            <button
              type="button"
              class="remove-item"
              data-remove="${escapeHTML(key)}"
              aria-label="حذف المنتج"
            >
              ×
            </button>

          </div>
        `;
      })
      .join("");

  const subtotal =
    $("#cartSubtotal");

  if (subtotal) {
    const total =
      calculateCartTotal();

    subtotal.textContent =
      `${formatPrice(total)} جنيه`;
  }


  updateCardQuantities();
}


function openCart() {
  const overlay =
    $("#cartOverlay");

  const drawer =
    $("#cartDrawer");

  if (!overlay || !drawer) {
    console.error(
      "Cart elements not found"
    );

    return;
  }

  renderCart();

  overlay.classList.add(
    "open",
    "active"
  );

  drawer.classList.add(
    "open",
    "active"
  );

  drawer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "no-scroll"
  );
}

function closeCart() {
  const overlay =
    $("#cartOverlay");

  const drawer =
    $("#cartDrawer");

  if (!overlay || !drawer) {
    return;
  }

  overlay.classList.remove(
    "open",
    "active"
  );

  drawer.classList.remove(
    "open",
    "active"
  );

  drawer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "no-scroll"
  );
}

function handleProductAction(event) {
  const addButton =
    event.target.closest(
      "[data-add]"
    );

  if (addButton) {
    addToCart(
      addButton.dataset.add
    );

    return;
  }

  const cardQuantityButton =
    event.target.closest(
      "[data-card-qty]"
    );

  if (cardQuantityButton) {
    const id =
      cardQuantityButton.dataset.cardQty;

    const delta =
      Number(
        cardQuantityButton.dataset.delta
      );

    if (delta > 0) {
      addToCart(id);

    } else {
      const item =
        state.cart.find(
          entry =>
            Number(entry.id) ===
              Number(id) &&
            !entry.options
        );

      if (item) {
        changeQuantity(
          item.uid ||
            item.id,
          delta
        );
      }
    }

    return;
  }

  const quickButton =
    event.target.closest(
      "[data-quick]"
    );

  if (quickButton) {
    openQuickView(
      quickButton.dataset.quick
    );
  }
}

function addRecent(id) {
  const numericId =
    Number(id);

  if (
    !Number.isFinite(
      numericId
    )
  ) {
    return;
  }

  state.recent = [
    numericId,
    ...state.recent.filter(
      item =>
        Number(item) !==
        numericId
    )
  ].slice(0, 6);

  saveStorage();

  renderRecent();
}

function renderRecent() {
  const section =
    $("#recentSection");

  const list =
    $("#recentList");

  if (!section || !list) {
    return;
  }

  const products =
    state.recent
      .map(getProduct)
      .filter(Boolean);

  section.classList.toggle(
    "hidden",
    products.length === 0
  );

  list.innerHTML =
    products
      .map(product => `
        <button
          type="button"
          class="recent-item"
          data-quick="${product.id}"
        >
          ${
            product.image
              ? `
                <img
                  src="${escapeHTML(
                    product.image
                  )}"
                  alt=""
                  loading="lazy"
                >
              `
              : `
                <span
                  class="recent-image-placeholder"
                  aria-hidden="true"
                >
                  🦷
                </span>
              `
          }

          <span>
            <b>
              ${escapeHTML(
                product.title
              )}
            </b>

            <small>
              ${escapeHTML(
                product.categoryLabel
              )}
            </small>
          </span>

        </button>
      `)
      .join("");
}

function setCategory(category) {
  state.category =
    category || "all";

  state.page =
    1;

  $$("#categoryTabs .category-tab")
    .forEach(tab => {
      tab.classList.toggle(
        "selected",
        tab.dataset.category ===
        state.category
      );
    });

  const resultsLabel =
    $("#resultsLabel");

  if (resultsLabel) {
    resultsLabel.textContent =
      state.category === "all"
        ? "كل المنتجات"
        : "منتجات القسم";
  }

  renderProducts();
}

function compareProducts(a, b) {
  const priceA =
    Number(
      a.dataset.price || 0
    );

  const priceB =
    Number(
      b.dataset.price || 0
    );

  const nameA =
    (
      a.dataset.name ||
      a.querySelector(
        "h3"
      )?.textContent ||
      ""
    ).trim();

  const nameB =
    (
      b.dataset.name ||
      b.querySelector(
        "h3"
      )?.textContent ||
      ""
    ).trim();

  switch (state.sort) {
    case "price-low":
    case "price-asc":
    case "low":
      return priceA - priceB;

    case "price-high":
    case "price-desc":
    case "high":
      return priceB - priceA;

    case "name":
    case "name-asc":
    case "az":
      return nameA.localeCompare(
        nameB,
        "ar"
      );

    case "za":
    case "name-desc":
      return nameB.localeCompare(
        nameA,
        "ar"
      );

    default:
      return 0;
  }
}

function renderPagination(
  matchedCards
) {
  const pagination =
    $("#productsPagination");

  if (!pagination) {
    return;
  }

  const total =
    matchedCards.length;

  const pageSize =
    state.pageSize;

  const totalPages =
    Math.ceil(
      total /
      pageSize
    );

  if (totalPages <= 1) {
    pagination.innerHTML =
      "";

    pagination.classList.add(
      "hidden"
    );

    getProductCards()
      .forEach(card => {
        const visible =
          matchedCards.includes(
            card
          );

        card.style.display =
          visible
            ? ""
            : "none";

        card.classList.toggle(
          "hidden",
          !visible
        );
      });

    return;
  }

  state.page =
    Math.min(
      Math.max(
        1,
        state.page
      ),
      totalPages
    );

  const start =
    (state.page - 1) *
    pageSize;

  const end =
    start +
    pageSize;

  const pageCards =
    matchedCards.slice(
      start,
      end
    );

  getProductCards()
    .forEach(card => {
      const visible =
        pageCards.includes(
          card
        );

      card.style.display =
        visible
          ? ""
          : "none";

      card.classList.toggle(
        "hidden",
        !visible
      );
    });

  const addPageButton =
    (
      label,
      page,
      active = false,
      disabled = false
    ) => `

      <button
        type="button"
        class="pagination-button${
          active
            ? " active"
            : ""
        }"
        data-page="${page}"

        ${
          disabled
            ? "disabled"
            : ""
        }

        aria-label="الصفحة ${page}"

        ${
          active
            ? 'aria-current="page"'
            : ""
        }
      >

        ${label}

      </button>
    `;

  const addEllipsis =
    () => `

      <span
        class="pagination-ellipsis"
        aria-hidden="true"
      >
        …
      </span>

    `;

  let html = `

    <button
      type="button"
      class="pagination-button pagination-arrow"
      data-page="${state.page - 1}"

      ${
        state.page === 1
          ? "disabled"
          : ""
      }

      aria-label="الصفحة السابقة"
    >
      ‹
    </button>

  `;

  if (totalPages <= 7) {
    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {
      html +=
        addPageButton(
          i,
          i,
          i === state.page
        );
    }

  } else if (
    state.page <= 3
  ) {
    html +=
      addPageButton(
        1,
        1,
        state.page === 1
      );

    html +=
      addPageButton(
        2,
        2,
        state.page === 2
      );

    html +=
      addPageButton(
        3,
        3,
        state.page === 3
      );

    html +=
      addEllipsis();

    html +=
      addPageButton(
        totalPages,
        totalPages,
        state.page ===
        totalPages
      );

  } else if (
    state.page >=
    totalPages - 2
  ) {
    html +=
      addPageButton(
        1,
        1,
        state.page === 1
      );

    html +=
      addEllipsis();

    html +=
      addPageButton(
        totalPages - 2,
        totalPages - 2,
        state.page ===
        totalPages - 2
      );

    html +=
      addPageButton(
        totalPages - 1,
        totalPages - 1,
        state.page ===
        totalPages - 1
      );

    html +=
      addPageButton(
        totalPages,
        totalPages,
        state.page ===
        totalPages
      );

  } else {
    html +=
      addPageButton(
        1,
        1,
        state.page === 1
      );

    html +=
      addEllipsis();

    html +=
      addPageButton(
        state.page - 1,
        state.page - 1
      );

    html +=
      addPageButton(
        state.page,
        state.page,
        true
      );

    html +=
      addPageButton(
        state.page + 1,
        state.page + 1
      );

    html +=
      addEllipsis();

    html +=
      addPageButton(
        totalPages,
        totalPages,
        state.page ===
        totalPages
      );
  }

  html += `

    <button
      type="button"
      class="pagination-button pagination-arrow"
      data-page="${state.page + 1}"

      ${
        state.page ===
        totalPages
          ? "disabled"
          : ""
      }

      aria-label="الصفحة التالية"
    >
      ›
    </button>

  `;

  pagination.innerHTML =
    html;

  pagination.classList.remove(
    "hidden"
  );

  pagination
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const targetPage =
            Number(
              button.dataset.page
            );

          if (
            !targetPage ||
            targetPage < 1 ||
            targetPage >
              totalPages
          ) {
            return;
          }

          state.page =
            targetPage;

          renderPagination(
            matchedCards
          );

          $("#products")
            ?.scrollIntoView({
              behavior:
                "smooth",
              block:
                "start"
            });
        }
      );
    });
}

function renderProducts() {
  const cards =
    getProductCards();

  if (!cards.length) {
    return;
  }

  let matchedCards =
    cards.filter(card => {
      const category =
        card.dataset.category ||
        "";

      const name =
        (
          card.dataset.name ||
          card.querySelector(
            "h3"
          )?.textContent ||
          ""
        ).toLowerCase();

      const matchesCategory =
        state.category === "all" ||
        category ===
        state.category;

      const matchesSearch =
        !state.query ||
        name.includes(
          state.query.toLowerCase()
        );

      return (
        matchesCategory &&
        matchesSearch
      );
    });

  matchedCards =
    matchedCards.sort(
      compareProducts
    );

  const resultsCount =
    $("#resultsCount");

  if (resultsCount) {
    resultsCount.textContent =
      `${formatCount(
        matchedCards.length
      )} منتجات`;
  }

  const emptyState =
    $("#emptyState");

  if (emptyState) {
    emptyState.classList.toggle(
      "hidden",
      matchedCards.length > 0
    );
  }

  const grid =
    $("#productsGrid");

  if (grid) {
    grid.classList.toggle(
      "hidden",
      matchedCards.length === 0
    );
  }

  renderPagination(
    matchedCards
  );

  updateCardPrices();
  updateCardQuantities();
}

function openQuickView(id) {
  const product =
    getProduct(id);

  if (!product) {
    return;
  }

  addRecent(
    product.id
  );

  const content =
    $("#quickViewContent");

  if (!content) {
    return;
  }

  content.innerHTML = `

    <div class="quick-view-layout">

      <div class="quick-view-image">

        ${
          product.image
            ? `
              <img
                src="${escapeHTML(
                  product.image
                )}"
                alt="${escapeHTML(
                  product.title
                )}"
              >
            `
            : `
              <div class="quick-view-placeholder">
                🦷
              </div>
            `
        }

      </div>

      <div class="quick-view-info">

        <span class="quick-meta">

          ${escapeHTML(
            product.categoryLabel
          )}

          ·

          DM-${String(
            product.id
          ).padStart(
            3,
            "0"
          )}

        </span>

        <h2>
          ${escapeHTML(
            product.title
          )}
        </h2>

        <p>
          ${escapeHTML(
            product.description
          )}
        </p>

        <div class="quick-price">

          <span>
            السعر
          </span>

          <strong>
            ${formatPrice(
              product.price
            )}
            جنيه
          </strong>

        </div>

        <button
          type="button"
          class="button button-primary"
          data-add="${product.id}"
        >
          أضف إلى السلة

          <span>
            ＋
          </span>

        </button>

      </div>

    </div>

  `;

  const backdrop =
    $("#quickViewBackdrop");

  if (backdrop) {
    backdrop.classList.add(
      "open",
      "active"
    );
  }

  document.body.classList.add(
    "no-scroll"
  );
}

function closeQuickView() {
  const backdrop =
    $("#quickViewBackdrop");

  if (!backdrop) {
    return;
  }

  backdrop.classList.remove(
    "open",
    "active"
  );

  document.body.classList.remove(
    "no-scroll"
  );
}

function initTeethSelector() {
  const typeEl =
    $("#teethType");

  if (!typeEl) {
    return;
  }

  let quantity =
    1;

  let direction =
    document.querySelector(
      "#teethDirection .choice-chip.selected"
    )?.dataset.direction ||

    document.querySelector(
      "#teethDirection .choice-chip"
    )?.dataset.direction ||

    "";

  let size =
    document.querySelector(
      "#teethSize .choice-chip.selected"
    )?.dataset.size ||

    document.querySelector(
      "#teethSize .choice-chip"
    )?.dataset.size ||

    "";

  function updateSummary() {
    const quantityEl =
      $("#teethQuantity");

    const summary =
      $("#teethSummary");

    if (quantityEl) {
      quantityEl.textContent =
        formatCount(
          quantity
        );
    }

    if (summary) {
      summary.textContent =
        `${typeEl.value} · ${direction} · ${size} · الكمية: ${quantity}`;
    }
  }

  const directionContainer =
    $("#teethDirection");

  directionContainer
    ?.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-direction]"
          );

        if (!button) {
          return;
        }

        direction =
          button.dataset.direction;

        $$("#teethDirection .choice-chip")
          .forEach(chip => {
            chip.classList.toggle(
              "selected",
              chip === button
            );
          });

        updateSummary();
      }
    );

  const sizeContainer =
    $("#teethSize");

  sizeContainer
    ?.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-size]"
          );

        if (!button) {
          return;
        }

        size =
          button.dataset.size;

        $$("#teethSize .choice-chip")
          .forEach(chip => {
            chip.classList.toggle(
              "selected",
              chip === button
            );
          });

        updateSummary();
      }
    );

  typeEl.addEventListener(
    "change",
    updateSummary
  );

  $("#teethMinus")
    ?.addEventListener(
      "click",
      () => {
        quantity =
          Math.max(
            1,
            quantity - 1
          );

        updateSummary();
      }
    );

  $("#teethPlus")
    ?.addEventListener(
      "click",
      () => {
        quantity =
          Math.min(
            99,
            quantity + 1
          );

        updateSummary();
      }
    );

  $("#addTeethToCart")
    ?.addEventListener(
      "click",
      () => {
        const existing =
          state.cart.find(
            item =>
              String(item.id) ===
                "custom-teeth" &&

              item.options &&

              item.options.type ===
                typeEl.value &&

              item.options.direction ===
                direction &&

              item.options.size ===
                size
          );

        if (existing) {
          existing.quantity =
            Number(
              existing.quantity || 0
            ) +
            quantity;

        } else {
          state.cart.push({
            id:
              "custom-teeth",

            uid:
              `teeth-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

            quantity:
              quantity,

            options: {
              type:
                typeEl.value,

              direction:
                direction,

              size:
                size
            }
          });
        }

        saveStorage();

        renderCart();

        showToast(
          "تمت إضافة اختيار الأسنان إلى السلة"
        );
      }
    );

  updateSummary();
}

function buildWhatsAppUrl(
  message
) {
  return (
    `https://wa.me/${WHATSAPP_NUMBER}` +
    `?text=${encodeURIComponent(
      message
    )}`
  );
}

function checkout() {
  if (
    state.cart.length === 0
  ) {
    showToast(
      "السلة فاضية"
    );

    return;
  }

  const lines =
    state.cart
      .map(item => {
        const product =
          getProduct(item.id);

        if (!product) {
          return "";
        }

        let line =
          `• ${product.title} × ${item.quantity}`;

        if (
          item.options
        ) {
          line +=
            `\n  النوع: ${item.options.type}` +
            `\n  الاتجاه: ${item.options.direction}` +
            `\n  المقاس: ${item.options.size}`;
        }

        return line;
      })
      .filter(Boolean)
      .join("\n\n");

  const total =
    calculateCartTotal();

  const message =
    `مرحباً DM Dental Store، أريد تأكيد الطلب:\n\n` +
    `${lines}\n\n` +
    `الإجمالي التقريبي: ${formatPrice(total)} جنيه`;

  window.open(
    buildWhatsAppUrl(
      message
    ),
    "_blank"
  );
}

function updateThemeButton() {
  const button =
    $("#themeToggle");

  if (!button) {
    return;
  }

  const isDark =
    document.body.classList.contains(
      "dark"
    ) ||
    document.body.classList.contains(
      "dark-mode"
    );

  button.setAttribute(
    "aria-label",
    isDark
      ? "التبديل إلى الوضع الفاتح"
      : "التبديل إلى الوضع الداكن"
  );

  button.setAttribute(
    "title",
    isDark
      ? "الوضع الفاتح"
      : "الوضع الداكن"
  );

  button.classList.toggle(
    "is-dark",
    isDark
  );

  const sun =
    button.querySelector(
      ".sun-icon"
    );

  const moon =
    button.querySelector(
      ".moon-icon"
    );

  if (sun) {
    sun.style.display =
      isDark
        ? "inline-flex"
        : "none";
  }

  if (moon) {
    moon.style.display =
      isDark
        ? "none"
        : "inline-flex";
  }
}

function applyTheme() {
  let savedTheme =
    null;

  try {
    savedTheme =
      localStorage.getItem(
        STORAGE.theme
      );

  } catch (error) {
    console.warn(
      "Unable to read theme:",
      error
    );
  }

  const isDark =
    savedTheme === "dark";

  document.body.classList.toggle(
    "dark",
    isDark
  );

  document.body.classList.toggle(
    "dark-mode",
    isDark
  );

  updateThemeButton();
}

function toggleTheme() {
  const isDark =
    document.body.classList.contains(
      "dark"
    ) ||
    document.body.classList.contains(
      "dark-mode"
    );

  const nextIsDark =
    !isDark;

  document.body.classList.toggle(
    "dark",
    nextIsDark
  );

  document.body.classList.toggle(
    "dark-mode",
    nextIsDark
  );

  try {
    localStorage.setItem(
      STORAGE.theme,
      nextIsDark
        ? "dark"
        : "light"
    );

  } catch (error) {
    console.warn(
      "Unable to save theme:",
      error
    );
  }

  updateThemeButton();
}

function showToast(message) {
  const toast =
    $("#toast");

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show",
    "active"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {
        toast.classList.remove(
          "show",
          "active"
        );
      },
      2500
    );
}

function bindEvents() {
  const categoryTabs =
    $("#categoryTabs");

  categoryTabs
    ?.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-category]"
          );

        if (!button) {
          return;
        }

        setCategory(
          button.dataset.category
        );
      }
    );

  const searchInput =
    $("#productSearch") ||
    $("#searchInput");

  searchInput
    ?.addEventListener(
      "input",
      event => {
        state.query =
          event.target.value
            .trim();

        state.page =
          1;

        renderProducts();
      }
    );

  $("#sortSelect")
    ?.addEventListener(
      "change",
      event => {
        state.sort =
          event.target.value;

        state.page =
          1;

        renderProducts();
      }
    );

  const productGrid =
    $("#productsGrid") ||
    $("#productGrid");

  productGrid
    ?.addEventListener(
      "click",
      handleProductAction
    );

  $("#cartItems")
    ?.addEventListener(
      "click",
      event => {
        const quantityButton =
          event.target.closest(
            "[data-qty]"
          );

        const removeButton =
          event.target.closest(
            "[data-remove]"
          );

        if (
          quantityButton
        ) {
          changeQuantity(
            quantityButton.dataset.qty,
            Number(
              quantityButton.dataset.delta
            )
          );

          return;
        }

        if (
          removeButton
        ) {
          removeFromCart(
            removeButton.dataset.remove
          );
        }
      }
    );

  $("#quickViewContent")
    ?.addEventListener(
      "click",
      handleProductAction
    );

  $("#recentList")
    ?.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-quick]"
          );

        if (!button) {
          return;
        }

        openQuickView(
          button.dataset.quick
        );
      }
    );

  $("#openCart")
    ?.addEventListener(
      "click",
      event => {
        event.preventDefault();

        openCart();
      }
    );

  $("#closeCart")
    ?.addEventListener(
      "click",
      event => {
        event.preventDefault();

        closeCart();
      }
    );

  $("#cartOverlay")
    ?.addEventListener(
      "click",
      closeCart
    );

  $("#continueShopping")
    ?.addEventListener(
      "click",
      () => {
        closeCart();

        $("#products")
          ?.scrollIntoView({
            behavior:
              "smooth"
          });
      }
    );

  $("#checkoutButton")
    ?.addEventListener(
      "click",
      checkout
    );

  $("#clearCart")
    ?.addEventListener(
      "click",
      () => {
        state.cart = [];

        saveStorage();

        renderCart();

        showToast(
          "تم إفراغ السلة"
        );
      }
    );

  $("#themeToggle")
    ?.addEventListener(
      "click",
      toggleTheme
    );

  $("#closeQuickView")
    ?.addEventListener(
      "click",
      closeQuickView
    );

  $("#quickViewBackdrop")
    ?.addEventListener(
      "click",
      event => {
        const backdrop =
          $("#quickViewBackdrop");

        if (
          event.target ===
          backdrop
        ) {
          closeQuickView();
        }
      }
    );

  $("#resetFilters")
    ?.addEventListener(
      "click",
      () => {
        state.category =
          "all";

        state.query =
          "";

        state.sort =
          "featured";

        state.page =
          1;

        const search =
          $("#productSearch") ||
          $("#searchInput");

        if (search) {
          search.value =
            "";
        }

        const sort =
          $("#sortSelect");

        if (sort) {
          sort.value =
            "featured";
        }

        $$("#categoryTabs .category-tab")
          .forEach(tab => {
            tab.classList.toggle(
              "selected",
              tab.dataset.category ===
                "all"
            );
          });

        renderProducts();
      }
    );

  $("#mobileMenuButton")
    ?.addEventListener(
      "click",
      () => {
        const menu =
          $("#mobileNav");

        if (!menu) {
          return;
        }

        menu.classList.toggle(
          "active"
        );

        menu.classList.toggle(
          "open"
        );
      }
    );

  $("#mobileNav")
    ?.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "a"
          )
        ) {
          $("#mobileNav")
            ?.classList.remove(
              "active",
              "open"
            );
        }
      }
    );

  $("#contactWhatsapp")
    ?.addEventListener(
      "click",
      event => {
        event.preventDefault();

        const message =
          "مرحباً DM Dental Store، أريد الاستفسار عن المنتجات.";

        window.open(
          buildWhatsAppUrl(
            message
          ),
          "_blank"
        );
      }
    );

  document.addEventListener(
    "keydown",
    event => {
      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key.toLowerCase() ===
          "k"
      ) {
        event.preventDefault();

        (
          $("#productSearch") ||
          $("#searchInput")
        )?.focus();

        $("#products")
          ?.scrollIntoView({
            behavior:
              "smooth"
          });
      }

      if (
        event.key ===
        "Escape"
      ) {
        closeCart();
        closeQuickView();
      }
    }
  );
}

let appInitialized =
  false;

function init() {
  if (appInitialized) {
    return;
  }

  appInitialized =
    true;

  const year =
    $("#currentYear");

  if (year) {
    year.textContent =
      new Date()
        .getFullYear();
  }

  loadStorage();

  applyTheme();

  bindEvents();

  const allProductsCount =
    $("#allProductsCount");

  if (allProductsCount) {
    allProductsCount.textContent =
      formatCount(
        getProductCards().length
      );
  }

  renderProducts();

  updateCardPrices();

  renderCart();

  renderRecent();

  initTeethSelector();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init
  );
} else {
  init();
}
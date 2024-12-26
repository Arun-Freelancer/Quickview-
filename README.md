# Quick View Button and Popup...
Button and Popup for collection Page in Shopify... Display product Data with fetch API on popup to Collection Page
Follow these steps..
1. Add a button to your Collection items
2. Create a Snippet File (product-quick_buy.liquid)
3. Create a Asset File (product-quick_buy.css)
4. Create a Section File ( quick-view.liquid )
5. Create a Assest File (quick-view.js)

After Creating all files, implement this code in your theme.liquid inside the body closing tag...
 {% render 'product-quick_buy' %}
  <script src="{{ 'quick-view.js' | asset_url }}" async></script>

After Implementing these code... add a button inside the product item snippet for code.. where the product card is showing (product-item.liquid)

  {% if section.settings['show_quick-buy'] %}
    <button class="quick_buy--button" data-modal="quick_buy--modal" data-handle="{{ product.handle }}">
      ZUM Warenkorb
    </button>
  {% endif %}


 Also include this css file to your main-collection.liquid Files,
{{ 'product-quick_buy.css' | asset_url | stylesheet_tag }}


After that get all the files data from given files.. 

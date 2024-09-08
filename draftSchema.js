export default {
    url: "https://openapi.etsy.com/v3/application/shops/{shop_id}/listings",
    method: "POST",
    schemas: {
        post: {
            operationId: "createDraftListing",
            description:
                '<div class="wt-display-flex-xs wt-align-items-center wt-mt-xs-2 wt-mb-xs-3"><span class="wt-badge wt-badge--notificationPrimary wt-bg-slime-tint wt-mr-xs-2">General Release</span><a class="wt-text-link" href="https://github.com/etsy/open-api/discussions" target="_blank" rel="noopener noreferrer">Report bug</a></div><div class="wt-display-flex-xs wt-align-items-center wt-mt-xs-2 wt-mb-xs-3"><p class="wt-text-body-01 banner-text">This endpoint is ready for production use.</p></div>\n\nCreates a physical draft [listing](/documentation/reference#tag/ShopListing) product in a shop on the Etsy channel.',
            tags: ["ShopListing"],
            parameters: [
                {
                    name: "shop_id",
                    in: "path",
                    description:
                        "The unique positive non-zero numeric ID for an Etsy Shop.",
                    required: true,
                    schema: {
                        type: "integer",
                        description:
                            "The unique positive non-zero numeric ID for an Etsy Shop.",
                        minimum: 1,
                    },
                },
            ],
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        schema: {
                            type: "object",
                            required: [
                                "quantity",
                                "title",
                                "description",
                                "price",
                                "who_made",
                                "when_made",
                                "taxonomy_id",
                            ],
                            properties: {
                                quantity: {
                                    type: "integer",
                                    description:
                                        "The positive non-zero number of products available for purchase in the listing. Note: The listing quantity is the sum of available offering quantities. You can request the quantities for individual offerings from the ListingInventory resource using the [getListingInventory](/documentation/reference#operation/getListingInventory) endpoint.",
                                },
                                title: {
                                    type: "string",
                                    description:
                                        "The listing's title string. When creating or updating a listing, valid title strings contain only letters, numbers, punctuation marks, mathematical symbols, whitespace characters, ™, ©, and ®. (regex: /[^\\p{L}\\p{Nd}\\p{P}\\p{Sm}\\p{Zs}™©®]/u) You can only use the %, :, & and + characters once each.",
                                },
                                description: {
                                    type: "string",
                                    description:
                                        "A description string of the product for sale in the listing.",
                                },
                                price: {
                                    type: "number",
                                    description:
                                        "The positive non-zero price of the product. (Sold product listings are private) Note: The price is the minimum possible price. The [`getListingInventory`](/documentation/reference/#operation/getListingInventory) method requests exact prices for available offerings.",
                                    format: "float",
                                },
                                who_made: {
                                    type: "string",
                                    description:
                                        "An enumerated string indicating who made the product. Helps buyers locate the listing under the Handmade heading. Requires 'is_supply' and 'when_made'.",
                                    enum: [
                                        "i_did",
                                        "someone_else",
                                        "collective",
                                    ],
                                },
                                when_made: {
                                    type: "string",
                                    description:
                                        "An enumerated string for the era in which the maker made the product in this listing. Helps buyers locate the listing under the Vintage heading. Requires 'is_supply' and 'who_made'.",
                                    enum: [
                                        "made_to_order",
                                        "2020_2024",
                                        "2010_2019",
                                        "2005_2009",
                                        "before_2005",
                                        "2000_2004",
                                        "1990s",
                                        "1980s",
                                        "1970s",
                                        "1960s",
                                        "1950s",
                                        "1940s",
                                        "1930s",
                                        "1920s",
                                        "1910s",
                                        "1900s",
                                        "1800s",
                                        "1700s",
                                        "before_1700",
                                    ],
                                },
                                taxonomy_id: {
                                    type: "integer",
                                    description:
                                        "The numerical taxonomy ID of the listing. See [SellerTaxonomy](/documentation/reference#tag/SellerTaxonomy) and [BuyerTaxonomy](/documentation/reference#tag/BuyerTaxonomy) for more information.",
                                    minimum: 1,
                                },
                                shipping_profile_id: {
                                    type: "integer",
                                    description:
                                        "The numeric ID of the [shipping profile](/documentation/reference#operation/getShopShippingProfile) associated with the listing. Required when listing type is `physical`.",
                                    nullable: true,
                                    minimum: 1,
                                },
                                return_policy_id: {
                                    type: "integer",
                                    description:
                                        "The numeric ID of the [Return Policy](/documentation/reference#operation/getShopReturnPolicies).",
                                    nullable: true,
                                    minimum: 1,
                                },
                                materials: {
                                    type: "array",
                                    description:
                                        "A list of material strings for materials used in the product. Valid materials strings contain only letters, numbers, and whitespace characters. (regex: /[^\\p{L}\\p{Nd}\\p{Zs}]/u) Default value is null.",
                                    nullable: true,
                                    items: {
                                        type: "string",
                                    },
                                },
                                shop_section_id: {
                                    type: "integer",
                                    description:
                                        "The numeric ID of the [shop section](/documentation/reference#tag/Shop-Section) for this listing. Default value is null.",
                                    nullable: true,
                                    minimum: 1,
                                },
                                processing_min: {
                                    type: "integer",
                                    description:
                                        "The minimum number of days required to process this listing. Default value is null.",
                                    nullable: true,
                                },
                                processing_max: {
                                    type: "integer",
                                    description:
                                        "The maximum number of days required to process this listing. Default value is null.",
                                    nullable: true,
                                },
                                tags: {
                                    type: "array",
                                    description:
                                        "A comma-separated list of tag strings for the listing. When creating or updating a listing, valid tag strings contain only letters, numbers, whitespace characters, -, ', ™, ©, and ®. (regex: /[^\\p{L}\\p{Nd}\\p{Zs}\\-'™©®]/u) Default value is null.",
                                    nullable: true,
                                    items: {
                                        type: "string",
                                    },
                                },
                                styles: {
                                    type: "array",
                                    description:
                                        'An array of style strings for this listing, each of which is free-form text string such as "Formal", or "Steampunk". When creating or updating a listing, the listing may have up to two styles. Valid style strings contain only letters, numbers, and whitespace characters. (regex: /[^\\p{L}\\p{Nd}\\p{Zs}]/u) Default value is null.',
                                    nullable: true,
                                    items: {
                                        type: "string",
                                    },
                                },
                                item_weight: {
                                    type: "number",
                                    description:
                                        "The numeric weight of the product measured in units set in 'item_weight_unit'. Default value is null. If set, the value must be greater than 0.",
                                    format: "float",
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 1.79769313486e308,
                                },
                                item_length: {
                                    type: "number",
                                    description:
                                        "The numeric length of the product measured in units set in 'item_dimensions_unit'. Default value is null. If set, the value must be greater than 0.",
                                    format: "float",
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 1.79769313486e308,
                                },
                                item_width: {
                                    type: "number",
                                    description:
                                        "The numeric width of the product measured in units set in 'item_dimensions_unit'. Default value is null. If set, the value must be greater than 0.",
                                    format: "float",
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 1.79769313486e308,
                                },
                                item_height: {
                                    type: "number",
                                    description:
                                        "The numeric height of the product measured in units set in 'item_dimensions_unit'. Default value is null. If set, the value must be greater than 0.",
                                    format: "float",
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 1.79769313486e308,
                                },
                                item_weight_unit: {
                                    type: "string",
                                    description:
                                        "A string defining the units used to measure the weight of the product. Default value is null.",
                                    nullable: true,
                                    enum: ["oz", "lb", "g", "kg"],
                                },
                                item_dimensions_unit: {
                                    type: "string",
                                    description:
                                        "A string defining the units used to measure the dimensions of the product. Default value is null.",
                                    nullable: true,
                                    enum: [
                                        "in",
                                        "ft",
                                        "mm",
                                        "cm",
                                        "m",
                                        "yd",
                                        "inches",
                                    ],
                                },
                                is_personalizable: {
                                    type: "boolean",
                                    description:
                                        "When true, this listing is personalizable. The default value is null.",
                                },
                                personalization_is_required: {
                                    type: "boolean",
                                    description:
                                        "When true, this listing requires personalization. The default value is null. Will only change if is_personalizable is 'true'.",
                                },
                                personalization_char_count_max: {
                                    type: "integer",
                                    description:
                                        "This is an integer value representing the maximum length for the personalization message entered by the buyer. Will only change if is_personalizable is 'true'.",
                                },
                                personalization_instructions: {
                                    type: "string",
                                    description:
                                        "A string representing instructions for the buyer to enter the personalization. Will only change if is_personalizable is 'true'.",
                                },
                                production_partner_ids: {
                                    type: "array",
                                    description:
                                        "An array of unique IDs of production partner ids.",
                                    nullable: true,
                                    items: {
                                        type: "integer",
                                        minimum: 1,
                                    },
                                },
                                image_ids: {
                                    type: "array",
                                    description:
                                        "An array of numeric image IDs of the images in a listing, which can include up to 10 images.",
                                    nullable: true,
                                    items: {
                                        type: "integer",
                                        minimum: 1,
                                    },
                                },
                                is_supply: {
                                    type: "boolean",
                                    description:
                                        "When true, tags the listing as a supply product, else indicates that it's a finished product. Helps buyers locate the listing under the Supplies heading. Requires 'who_made' and 'when_made'.",
                                },
                                is_customizable: {
                                    type: "boolean",
                                    description:
                                        "When true, a buyer may contact the seller for a customized order. The default value is true when a shop accepts custom orders. Does not apply to shops that do not accept custom orders.",
                                },
                                should_auto_renew: {
                                    type: "boolean",
                                    description:
                                        "When true, renews a listing for four months upon expiration.",
                                },
                                is_taxable: {
                                    type: "boolean",
                                    description:
                                        "When true, applicable [shop](/documentation/reference#tag/Shop) tax rates apply to this listing at checkout.",
                                },
                                type: {
                                    type: "string",
                                    description:
                                        "An enumerated type string that indicates whether the listing is physical or a digital download.",
                                    enum: ["physical", "download", "both"],
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

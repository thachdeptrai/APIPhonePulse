// middleware/validateMiddleware.js
const { body, validationResult } = require("express-validator");

/**
 * Middleware validate dữ liệu đầu vào
 * @param {Object} schema - Schema validation rules
 * @returns {Array} Array of validation middlewares
 */
const validateMiddleware = (schema) => {
  // Tạo array các validation rules từ schema
  const validationRules = Object.keys(schema).map((key) => {
    const rules = schema[key];
    let validator = body(key);

    // Áp dụng các rules
    Object.keys(rules).forEach((rule) => {
      switch (rule) {
        case "notEmpty":
          if (rules[rule]) {
            validator = validator.notEmpty().withMessage(`${key} là bắt buộc`);
          }
          break;

        case "isEmail":
          validator = validator
            .isEmail()
            .withMessage(
              rules[rule].errorMessage || `${key} phải là email hợp lệ`
            );
          break;

        case "isLength":
          validator = validator
            .isLength(rules[rule].options)
            .withMessage(
              rules[rule].errorMessage || `${key} không đúng độ dài`
            );
          break;

        case "isNumeric":
          validator = validator
            .isNumeric()
            .withMessage(rules[rule].errorMessage || `${key} phải là số`);
          break;

        case "isBoolean":
          validator = validator
            .isBoolean()
            .withMessage(rules[rule].errorMessage || `${key} phải là boolean`);
          break;

        case "isURL":
          validator = validator
            .isURL()
            .withMessage(
              rules[rule].errorMessage || `${key} phải là URL hợp lệ`
            );
          break;

        case "isIn":
          validator = validator
            .isIn(rules[rule].options)
            .withMessage(rules[rule].errorMessage || `${key} không hợp lệ`);
          break;

        case "isDate":
          validator = validator
            .isISO8601()
            .withMessage(
              rules[rule].errorMessage || `${key} phải là ngày hợp lệ`
            );
          break;

        case "matches":
          validator = validator
            .matches(rules[rule].pattern)
            .withMessage(
              rules[rule].errorMessage || `${key} không đúng định dạng`
            );
          break;

        case "custom":
          validator = validator
            .custom(rules[rule].validator)
            .withMessage(rules[rule].errorMessage || `${key} không hợp lệ`);
          break;

        case "trim":
          if (rules[rule]) {
            validator = validator.trim();
          }
          break;

        case "normalizeEmail":
          if (rules[rule]) {
            validator = validator.normalizeEmail();
          }
          break;

        case "optional":
          if (rules[rule]) {
            validator = validator.optional();
          }
          break;

        default:
          break;
      }
    });

    return validator;
  });

  // Thêm middleware xử lý lỗi validation
  const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      }));

      return res.status(400).json({
        success: false,
        message: "Dữ liệu đầu vào không hợp lệ",
        errors: formattedErrors,
      });
    }

    next();
  };

  return [...validationRules, handleValidationErrors];
};

/**
 * Custom validators
 */
const customValidators = {
  // Kiểm tra password mạnh
  strongPassword: (value) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return strongPasswordRegex.test(value);
  },

  // Kiểm tra số điện thoại Việt Nam
  vietnamesePhone: (value) => {
    const vietnamesePhoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return vietnamesePhoneRegex.test(value);
  },

  // Kiểm tra tuổi hợp lệ (>= 13 tuổi)
  validAge: (value) => {
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 13;
  },

  // Kiểm tra file upload hợp lệ
  validImageFile: (value) => {
    if (!value) return true; // Optional field
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    return allowedTypes.includes(value.mimetype);
  },
};

/**
 * Predefined validation schemas
 */
const validationSchemas = {
  // Schema đăng ký
  register: {
    name: {
      notEmpty: true,
      isLength: {
        options: { min: 2, max: 50 },
        errorMessage: "Tên phải có từ 2-50 ký tự",
      },
      trim: true,
    },
    email: {
      isEmail: {
        errorMessage: "Email không hợp lệ",
      },
      normalizeEmail: true,
    },
    password: {
      isLength: {
        options: { min: 6 },
        errorMessage: "Mật khẩu phải có ít nhất 6 ký tự",
      },
      custom: {
        validator: customValidators.strongPassword,
        errorMessage:
          "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt",
      },
    },
    phone: {
      optional: true,
      custom: {
        validator: customValidators.vietnamesePhone,
        errorMessage: "Số điện thoại không hợp lệ",
      },
    },
    address: {
      optional: true,
      isLength: {
        options: { max: 255 },
        errorMessage: "Địa chỉ không được quá 255 ký tự",
      },
      trim: true,
    },
    gender: {
      optional: true,
      isIn: {
        options: ["Nam", "Nữ", "Khác", "Không chia sẻ"],
        errorMessage: "Giới tính không hợp lệ",
      },
    },
    birthday: {
      optional: true,
      isDate: {
        errorMessage: "Ngày sinh không hợp lệ",
      },
      custom: {
        validator: customValidators.validAge,
        errorMessage: "Bạn phải từ 13 tuổi trở lên",
      },
    },
    avatar_url: {
      optional: true,
      isURL: {
        errorMessage: "URL ảnh đại diện không hợp lệ",
      },
    },
  },

  // Schema đăng nhập
  login: {
    email: {
      isEmail: {
        errorMessage: "Email không hợp lệ",
      },
      normalizeEmail: true,
    },
    password: {
      notEmpty: {
        errorMessage: "Mật khẩu là bắt buộc",
      },
    },
  },

  // Schema cập nhật profile
  updateProfile: {
    name: {
      optional: true,
      isLength: {
        options: { min: 2, max: 50 },
        errorMessage: "Tên phải có từ 2-50 ký tự",
      },
      trim: true,
    },
    email: {
      optional: true,
      isEmail: {
        errorMessage: "Email không hợp lệ",
      },
      normalizeEmail: true,
    },
    phone: {
      optional: true,
      custom: {
        validator: customValidators.vietnamesePhone,
        errorMessage: "Số điện thoại không hợp lệ",
      },
    },
    address: {
      optional: true,
      isLength: {
        options: { max: 255 },
        errorMessage: "Địa chỉ không được quá 255 ký tự",
      },
      trim: true,
    },
gender: {
  optional: true,
  isIn: {
    options: ["Nam", "Nữ", "Khác", "Không chia sẻ"],
    errorMessage: "Giới tính không hợp lệ",
  },
},

    birthday: {
      optional: true,
      isDate: {
        errorMessage: "Ngày sinh không hợp lệ",
      },
      custom: {
        validator: customValidators.validAge,
        errorMessage: "Bạn phải từ 13 tuổi trở lên",
      },
    },
    avatar_url: {
      optional: true,
      isURL: {
        errorMessage: "URL ảnh đại diện không hợp lệ",
      },
    },
  },

  // Schema đổi mật khẩu
  changePassword: {
    currentPassword: {
      notEmpty: {
        errorMessage: "Mật khẩu hiện tại là bắt buộc",
      },
    },
    newPassword: {
      isLength: {
        options: { min: 6 },
        errorMessage: "Mật khẩu mới phải có ít nhất 6 ký tự",
      },
      custom: {
        validator: customValidators.strongPassword,
        errorMessage:
          "Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt",
      },
    },
  },
  // Schema thêm vào yêu thích
  addFavourite: {
    productId: {
      notEmpty: true,
      isLength: {
        options: { min: 1 },
        errorMessage: "productId là bắt buộc",
      },
    },
  },

  // Schema xoá khỏi yêu thích
  removeFromFavourite: {
    productId: {
      notEmpty: true,
      errorMessage: "productId là bắt buộc",
    },
  },
  addToCart: {
    'items.*.productId': {
      notEmpty: {
        errorMessage: 'ID sản phẩm là bắt buộc',
      },
      isMongoId: {
        errorMessage: 'ID sản phẩm không hợp lệ',
      },
    },
    'items.*.variantId': {
      notEmpty: {
        errorMessage: 'ID biến thể là bắt buộc',
      },
      isMongoId: {
        errorMessage: 'ID biến thể không hợp lệ',
      },
    },
    'items.*.quantity': {
      isInt: {
        options: { min: 1 },
        errorMessage: 'Số lượng phải là số nguyên >= 1',
      },
    },
  },  
  // Cập nhật số lượng sản phẩm trong giỏ hàng
  updateCartItem: {
    productId: {
      notEmpty: {
        errorMessage: "ID sản phẩm là bắt buộc",
      },
      isMongoId: {
        errorMessage: "ID sản phẩm không hợp lệ",
      },
    },
    quantity: {
      isInt: {
        options: { min: 1 },
        errorMessage: "Số lượng phải là số nguyên >= 1",
      },
    },
  },
  // Thêm đánh giá sản phẩm
  review: {
    productId: {
      notEmpty: {
        errorMessage: "ID sản phẩm là bắt buộc",
      },
      isMongoId: {
        errorMessage: "ID sản phẩm không hợp lệ",
      },
    },
    
    comment: {
      optional: true,
      isLength: {
        options: { max: 500 },
        errorMessage: "Bình luận không được dài quá 500 ký tự",
      },
      trim: true,
    },
  },
  // Schema áp dụng voucher
applyVoucher: {
  code: {
    notEmpty: {
      errorMessage: "Code không được để trống",
    },
    trim: true,
  },
},

createVoucher: {
  code: {
    notEmpty: {
      errorMessage: "Code không được để trống",
    },
    trim: true,
  },
  discount_value: {
    isNumeric: {
      errorMessage: "discount_value phải là số",
    },
    notEmpty: {
      errorMessage: "discount_value là bắt buộc",
    },
  },
  end_date: {
    isDate: {
      errorMessage: "Ngày hết hạn không hợp lệ",
    },
    notEmpty: {
      errorMessage: "Ngày hết hạn là bắt buộc",
    },
  },
  quantity: {
    isInt: {
      options: { min: 1 },
      errorMessage: "Số lượng phải là số nguyên >= 1",
    },
    notEmpty: {
      errorMessage: "Số lượng là bắt buộc",
    },
  },
},

  // Xoá sản phẩm khỏi giỏ hàng
  removeFromCart: {
    productId: {
      notEmpty: {
        errorMessage: "ID sản phẩm là bắt buộc",
      },
      isMongoId: {
        errorMessage: "ID sản phẩm không hợp lệ",
      },
    },
  },
};
module.exports = {
  validateMiddleware,
  validationSchemas,
};

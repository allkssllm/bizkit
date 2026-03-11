package dtos

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		Role     struct {
			Name        string `json:"name"`
			Permissions string `json:"permissions"`
		} `json:"role"`
		OutletName string `json:"outlet_name"`
	} `json:"user"`
}

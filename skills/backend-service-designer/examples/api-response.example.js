// examples/api-response.example.js
export class ApiResponse {
    static success(res, data = {}, message = "Success", statusCode = 200) {
        const hasMeta = data && typeof data === "object" && "meta" in data;
        const payloadData = hasMeta ? data.data : data;

        return res.status(statusCode).json({
            status: 1,
            message,
            data: payloadData !== undefined ? payloadData : {},
            ...(hasMeta && data.meta && { meta: data.meta }),
        });
    }

    static created(res, data = {}, message = "Resource created successfully") {
        return ApiResponse.success(res, data, message, 201);
    }
}

export default ApiResponse;

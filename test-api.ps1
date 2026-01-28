$body = '{"user":{"email":"test@example.com","password":"TestPass123","name":"Test User"},"business":{"company_name":"Test Business","industry":"generic","main_category":"Other","country":"AU","currency":"AUD"}}'

$headers = @{
    "Authorization" = "Bearer vSbUW4APNTZ4vck0qhzi9gFOcuTu7d2c"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/onboarding/import" -Method POST -Headers $headers -Body $body
    Write-Host "Status:" $response.StatusCode
    Write-Host "Response:" $response.Content
} catch {
    Write-Host "Error:" $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response Body:" $reader.ReadToEnd()
    }
}

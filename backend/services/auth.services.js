import supabase from "../supabase/supabase.js"


export const checkIfEmailInUse = async (email) => {
    const emailCheck = await supabase.from("Users").select("*").eq("email", email)

    if (emailCheck.data.length === 0) {
        return false
    } else {
        return true
    }

}

export const registerUserToSupabase = async (userData) => {
    const user = supabase.from("Users").insert([userData]).select()

    return user
}

export const grabUserFromSupabase = async (email) => {
    const user = await supabase.from("Users").select("*").eq("email", email)

    return user.data[0]
}

export const updateUserPassword = async (userId, password) => {
    return supabase
        .from("Users")
        .update({password})
        .eq("id", userId)
        .select("id")
        .single()
}

export const getUserById = async (userId) => {
    return supabase
        .from("Users")
        .select("id, username, email, first_name, last_name, created_at")
        .eq("id", userId)
        .single()
}

export const updateUserById = async (userId, userData) => {
    return supabase
        .from("Users")
        .update(userData)
        .eq("id", userId)
        .select("id, username, email, first_name, last_name, created_at")
        .single()
}

class Abogado {
    constructor({ id, username, nombre, apellido, password, cedula, email, telefono, user_type }) {
        this.id = id;
        this.username = username;
        this.nombre = nombre;
        this.apellido = apellido;
        this.password = password;
        this.cedula = cedula;
        this.email = email;
        this.telefono = telefono;
        this.user_type = user_type;
    }
}

export default Abogado;
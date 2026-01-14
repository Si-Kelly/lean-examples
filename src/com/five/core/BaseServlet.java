package com.five.core;

import java.io.IOException;
import java.util.Map;

import com.google.gson.Gson;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public abstract class BaseServlet extends HttpServlet {
    public void forwardTo(HttpServletRequest request, HttpServletResponse response, String path)
            throws ServletException, IOException {
        request.getRequestDispatcher("/META-INF" + path).forward(request, response);
    }

    public void redirect(HttpServletResponse response, String path) throws IOException {
        response.sendRedirect(path);
    }

    public void writeObject(HttpServletResponse response, String name, Object object) throws IOException {
        response.setContentType("application/json");
        Map<String, Object> map = Map.of(name, object);
        response.getWriter().write(new Gson().toJson(map));
    }

    public String getResourceIdentifier(HttpServletRequest request) {
        // return the last part of the url that represents the resource identifier
        String path = request.getRequestURI();
        String[] parts = path.split("/");
        return parts[parts.length - 1];
    }

    public String getResourceType(HttpServletRequest request) {
        String path = request.getRequestURI();
        String[] parts = path.split("/");
        return parts[parts.length - 2];
    }
}

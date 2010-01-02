# Name:       ObjectFrameGenerator
# Version:    0.2 (Mai 3 2009)
# Author:     Finn Rudolph
# Support:    http://finnrudolph.de/JavaScriptObject/SketchUp

# Licence:    ObjectGenerator is licensed under a Creative Commons 
#             Attribution-Noncommercial 3.0 Unported License 
#             (http://creativecommons.org/licenses/by-nc/3.0/).

#             You are free:
#                 + to Share - to copy, distribute and transmit the work
#                 + to Remix - to adapt the work

#             Under the following conditions:
#                 + Attribution. You must attribute the work in the manner specified by the author or licensor 
#                   (but not in any way that suggests that they endorse you or your use of the work). 
#                 + Noncommercial. You may not use this work for commercial purposes. 

#             + For any reuse or distribution, you must make clear to others the license terms of this work.
#             + Any of the above conditions can be waived if you get permission from the copyright holder.
#             + Nothing in this license impairs or restricts the author's moral rights.

# Pull standard SketchUp hooks
require 'sketchup.rb'

# Add a menu item to launch the plugin.
UI.menu("PlugIns").add_item("ObjectFrameGenerator") {

	# Initialize
	Sketchup.active_model.active_view.animation = ObjectFrameGenerator.new
}

class ObjectFrameGenerator

	def initialize

		# Settings
		@outputFolder = "C:/Temp/"		# Output directory for the images
		@imagesPerRevolution = 24		# Images per revolution around the x and y-axis
		@distanceToOrigin = 1500		# Distance to the 3D world origin at [0,0,0]
		@imageWidth = 500				# Width of the output image in pixel
		@imageHeight = 500				# Height of the output image in pixel
		@jpegQuality = 80				# 100 is best 0 is worst
		@oneRevolution = false			# Set 'true' for only one revolution around the x-axis
		@oneRevolutionAngle = 22.5		# X-axis camera angle for the 360° rotation in degrees

		# Target the camera on the origin
		@target = [0,0,0]

		# Set the camera up vector and coordinates
		@cameraUpVector = [0,0,1]
		@camera = [0,-1,0]

		# Use the SketchUp status field
		Sketchup.set_status_text($exStrings.GetString("Status:"), 1)

		# Set some globals
		@cameraXRotationsCount = 0
		@cameraXAxisDegrees = 0		
		@cameraZAxisDegrees = 0
		@frameCount = 0;
		@imagesPerRevolutionDegrees = 360 / @imagesPerRevolution
		@jpegQuality = @jpegQuality * 0.01
	end

	# Loop
	def nextFrame(view)

		# Increase rotation around the X-Axis after one revolution around the Z-Axis
		if(@frameCount == @imagesPerRevolution)

			@cameraXRotationsCount += 1

			# Reset
			@frameCount = 0
			@cameraZAxisDegrees = 0
	
			# Increase X-Axis rotation
			@cameraXAxisDegrees = @cameraXAxisDegrees + @imagesPerRevolutionDegrees

			# Switch the camera up vector
			if((@cameraXRotationsCount * @imagesPerRevolutionDegrees) > 90)
				@cameraUpVector = [0, 0, -1]
			end
			if((@cameraXRotationsCount * @imagesPerRevolutionDegrees) > 270)
				@cameraUpVector = [0, 0, 1]
			end
		end

		if(@oneRevolution) 
			@cameraXAxisDegrees = -@oneRevolutionAngle
		end

		# X-Axis rotation
		q = @cameraXAxisDegrees.degrees
		@eyeY = (@camera.y * Math::cos(q) - @camera.z * Math::sin(q))
		@eyeZ = (@camera.y * Math::sin(q) + @camera.z * Math::cos(q))

		# Do not let @eyeY get extremely close to zero for a correct z-axis rotation
		roundedY = sprintf("%.2f", @eyeY)
		if(roundedY == "0.00" or roundedY == "-0.00")
			@eyeY = 0.01
		end
		if((@cameraXRotationsCount * @imagesPerRevolutionDegrees) == 90)
			@eyeY = -0.01
		end

		# Z-Axis rotation
		@cameraZAxisDegrees = @cameraZAxisDegrees + @imagesPerRevolutionDegrees
		q = @cameraZAxisDegrees.degrees
		@eyeX = @camera.x * Math::cos(q) - @eyeY * Math::sin(q)
		@eyeY = @camera.x * Math::sin(q) + @eyeY * Math::cos(q)

		# Set new camera position 
		eyeX = @eyeX * @distanceToOrigin
		eyeY = @eyeY * @distanceToOrigin
		eyeZ = @eyeZ * @distanceToOrigin
		eye = [eyeX,eyeY,eyeZ]
		view.camera.set(eye, @target, @cameraUpVector)
		view.show_frame

		if(@cameraXRotationsCount < @imagesPerRevolution)

			# Write frame to file
			rowNumber = "%03d" % (@cameraXRotationsCount)
			colNumber = "%03d" % (@frameCount)
			fileName = rowNumber.to_s + "_" + colNumber.to_s + ".jpg"
			file = view.write_image @outputFolder+fileName, @imageWidth, @imageHeight, true, @jpegQuality

			# Update status message and continue
			Sketchup::set_status_text(" Writing "+fileName, 2)
			continue = true
			
		# Stop after one revolution around the X-Axis
		else
			Sketchup::set_status_text(" Done!", 2)
			continue = false
		end

		@frameCount = @frameCount + 1

		if(@oneRevolution && @frameCount == @imagesPerRevolution)
			Sketchup::set_status_text(" Done 360°!", 2)
			continue = false
		end

		return continue
	end
end